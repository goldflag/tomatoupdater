const client = require("./redis.js");
const db = require("../db");
const tankNames = require("../data/tankNames");

client.on("error", function(error) {
    console.error(error);
});

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }   

function PlayerLeaderboardQuery(parameter, server, min, mintier){
 return `
    SELECT 
        rank() OVER (
            ORDER BY ${parameter} DESC
        ),
        player_id, 
        battles, 
        avgTier, 
        WN8, 
        DPG,
        dmg_ratio,
        frags, 
        kd, 
        winrate,
        survival,
        decap, 
        spots
        FROM (SELECT 
            player_id, 
            sum(battles) AS battles, 
            round(sum(totalTier)/sum(battles), 2) AS avgTier, 
            round(sum(WN8)/sum(battles), 0) AS WN8, 
            round(sum(DPG)/sum(battles), 0) AS DPG,
            round(sum(DPG)/NULLIF(sum(DPGR), 0), 2) AS dmg_ratio,
            round(sum(frags)/sum(battles), 2) AS frags, 
            round(sum(frags)/NULLIF((sum(battles) - sum(survived)), 0), 2) as kd,                               
            round(sum(winrate)*100/sum(battles), 2) AS winrate,
            round(sum(survived)*100/sum(battles), 2) AS survival,
            round(sum(decap)/sum(battles), 2) AS decap, 
            round(sum(spots)/sum(battles), 2) AS spots
            FROM (
                SELECT 
                    tank_id, 
                    player_id, 
                    sum(battles) AS battles, 
                    sum(WN8) AS WN8, 
                    sum(damage) AS DPG, 
                    sum(damageR) AS DPGR,
                    sum(frags) AS frags, 
                    sum(survived) AS survived, 
                    sum(decap) AS decap, 
                    sum(spots) AS spots, 
                    sum(wins) AS winrate,
                    tier*sum(battles) AS totalTier
                FROM ${server}.sessions 
                INNER JOIN tanknames
                    ON tank_id = id
                WHERE timestamp > ${min} AND tier >= ${mintier} GROUP BY player_id, tank_id, tier) sub
            GROUP BY player_id ORDER BY WN8 DESC
        ) sub2
        WHERE sub2.battles > 75;
    `
}

function PlayerRankQuery(parameter, server, min){
    return `
       SELECT 
           rank() OVER (
               ORDER BY ${parameter} DESC
           ),
           battles,
           player_id, 
           WN8, 
           winrate,
           DPG,
           frags,
           dmg_ratio,
           kd
           FROM (SELECT 
                player_id, 
                sum(battles) AS battles, 
                round(sum(WN8)/sum(battles), 0) AS WN8, 
                round(sum(winrate)*100/sum(battles), 2) AS winrate,
                round(sum(damage)/sum(battles), 2) AS DPG,
                round(sum(frags)/sum(battles), 2) AS frags,
                round(sum(damage)/NULLIF(sum(damager), 0), 2) as dmg_ratio,                               
                round(sum(frags)/NULLIF((sum(battles) - sum(survived)), 0), 2) as kd     
               FROM (
                   SELECT 
                    player_id, 
                    sum(battles) AS battles, 
                    sum(WN8) AS WN8, 
                    sum(wins) AS winrate,
                    sum(damage) AS damage,
                    sum(frags) AS frags,
                    sum(damager) AS damager,
                    sum(survived) AS survived
                   FROM ${server}.sessions 
                   INNER JOIN tanknames
                        ON tank_id = id
                   WHERE timestamp > ${min} AND tier >= 6 GROUP BY player_id, tank_id, tier) sub
               GROUP BY player_id
           ) sub2
           WHERE sub2.battles > 75;
       `
   }

module.exports = {
    recentsLeaderboard : async function (server, parameter, time, mintier) {
        console.log(`recentsLeaderboard | ${server} | ${parameter} | ${time} | ${mintier}`);
        const min = parseInt(Date.now()/60000) - time*24*60;
        const data = await db.query(PlayerLeaderboardQuery(parameter, server, min, mintier));
        const len = parseInt(data.rows.length);
        client.set(`rtotal:${server}:${parameter}:${time}:${mintier}`, len, 'EX', 604800);

        for (let i = 0; i < len; i+=100) {
            const obj = [];
            for (let j = 0; j < 100; ++j) {
                if ((i + j) < data.rows.length) {
                    obj.push(data.rows[i + j]);
                }
            }
            client.set(`rleaders:${server}:${parameter}:${time}:${mintier}:${i/100}`, JSON.stringify(obj), 'EX', 604800);
        }
    },

    recentsLeaderboardRank : async function (server, parameter, time) {
        console.log(`recentsLeaderboardRank | ${server} | ${parameter} | ${time}`);
        const min = parseInt(Date.now()/60000) - time*24*60;
        const data = await db.query(PlayerRankQuery(parameter, server, min));
        const len = parseInt(data.rows.length);
        for (let i = 0; i < len; i++) {
            // console.log(data.rows[i]); 
            client.set(`rrank:${server}:${parameter}:${time}:${data.rows[i].player_id}`, data.rows[i].rank, 'EX', 604800);
        }
    },

    recentTankAverages: async function(server, time) {
        const min = parseInt(Date.now()/60000) - time*24*60;
        const data = await db.query(`
            SELECT 
            rank, tank_id, short_name, tier, nation, type AS class, battles, wn8, winrate, dpg, dmg_ratio, frags, kd, survival, spots, decap, is_premium
            FROM ( SELECT 
                rank() OVER (
                    ORDER BY sum(WN8)/sum(battles) DESC
                ) AS rank,
                tank_id,
                short_name,
                tier, 
                nation,
                type, 
                sum(battles) AS battles,
                round(sum(wins)::numeric*100/sum(battles), 2) as winrate,
                round(sum(WN8)::numeric/sum(battles), 0) AS WN8, 
                round(sum(damage)::numeric/sum(battles), 0) AS DPG,
                round(sum(damage)::numeric/NULLIF(sum(damageR), 0), 2) AS dmg_ratio,
                round(sum(frags)::numeric/sum(battles), 2) AS frags,
                round(sum(frags)::numeric/NULLIF((sum(battles) - sum(survived)), 0), 2) as kd,                               
                round(sum(survived)::numeric*100/sum(battles), 2) AS survival,
                round(sum(spots)::numeric/sum(battles), 2) AS spots,
                round(sum(decap)::numeric/sum(battles), 2) AS decap,
                is_premium
                FROM ${server}.sessions 
                INNER JOIN tanknames
                    ON tank_id = id
                WHERE timestamp > ${min} GROUP BY tank_id, short_name, tier, nation, type, is_premium) sub
            WHERE tier > 0;
        `);
        client.set(`rtankavg:${server}:${time}`, JSON.stringify(data.rows), 'EX', 604800);
    },

    tankRank: async function(server, parameter, time) {
        const min = parseInt(Date.now()/60000) - time*24*60;
        const fields = {
            "wn8": "sum(wn8)/sum(battles) as wn8, ",
            "dpg": "sum(damage)/sum(battles) as dpg, "
        }
        for (i in tankNames) {
            let tank_id = i;
            if (tankNames[i].tier >= 5) {
                await sleep(750);
                console.log(tankNames[i].short_name);
                const data = await db.query(`
                    SELECT rank() OVER (ORDER BY sub.${parameter} DESC), player_id, battles 
                        FROM (
                            SELECT 
                                ${fields[parameter]}
                                player_id, 
                                sum(battles) as battles 
                                FROM ${server}.sessions WHERE tank_id = ${i} AND timestamp > ${min}
                                GROUP by player_id
                        ) sub
                    WHERE sub.battles > 24
                `);
                const len = parseInt(data.rows.length);
                client.set(`rtankall:${server}:${tank_id}:${parameter}:${time}`, len, 'EX', 604800);
                for (i in data.rows) {
                    client.set(`rtankrank:${server}:${tank_id}:${parameter}:${time}:${data.rows[i].player_id}`, data.rows[i].rank, 'EX', 604800);
                }
            }
        }

    //     SELECT rank() OVER (ORDER BY dpg DESC), player_id, battles 
    //     FROM (
    //         SELECT 
    //         player_id, 
    //         sum(damage)/sum(battles) as dpg, 
    //         sum(wn8)/sum(battles) as wn8, 
    //         sum(battles) as battles 
    //             FROM com.sessions WHERE tank_id = 1 AND timestamp > 22
    //             GROUP by player_id
    //     ) sub
    // WHERE sub.battles > 24
    },

    tankLeaderboards: async function(server, parameter, time) {
        console.log(`tankLeaderboards | ${server} | ${parameter} | ${time}`);
        const min = parseInt(Date.now()/60000) - time*24*60;
        for (i in tankNames) {
            let tank_id = i;
            if (tankNames[i].tier >= 0) {
                await sleep(1000);
                console.log(tankNames[i].short_name);
                const data = await db.query(`
                    SELECT 
                        rank() OVER (ORDER BY ${parameter} DESC), 
                        player_id, 
                        battles, 
                        wn8,
                        winrate,
                        dpg,
                        frags,
                        kd,
                        survived, 
                        spots
                        FROM (
                            SELECT 
                                player_id, 
                                sum(battles) as battles,
                                sum(wn8)/sum(battles) as wn8,
                                round(sum(wins)::numeric*100/sum(battles), 2) as winrate,
                                sum(damage)/sum(battles) as dpg,
                                round(sum(damage)/NULLIF(sum(damager), 0), 2) as dmg_ratio,
                                round(sum(frags)::numeric/sum(battles), 2) as frags,
                                round(sum(frags)::numeric/NULLIF((sum(battles) - sum(survived)), 0), 2) as kd,                               
                                round(sum(survived)::numeric*100/sum(battles), 2) as survived,                               
                                round(sum(spots)::numeric/sum(battles), 2) as spots
                                FROM ${server}.sessions WHERE tank_id = ${tank_id} AND timestamp > ${min}
                                GROUP by player_id
                        ) sub
                    WHERE sub.battles > 24 LIMIT 500
                `);
                // console.log(data.rows);
                const len = parseInt(data.rows.length);
                client.set(`rtanktotal:${server}:${tank_id}:${parameter}:${time}`, len, 'EX', 604800);

                for (let i = 0; i < len; i+=100) {
                    const obj = [];
                    for (let j = 0; j < 100; ++j) {
                        if ((i + j) < data.rows.length) {
                            obj.push(data.rows[i + j]);
                        }
                    }
                    client.set(`rtankleaders:${server}:${tank_id}:${parameter}:${time}:${i/100}`, JSON.stringify(obj), 'EX', 604800);
                }
            }
        }
    }
};

/*

                    SELECT 
                        rank() OVER (ORDER BY dpg DESC), 
                        player_id, 
                        battles, 
                        wn8,
                        winrate,
                        dpg,
                        frags,
                        kd,
                        survived, 
                        spots
                        FROM (
                            SELECT 
                                player_id, 
                                sum(battles) as battles,
                                sum(wn8)/sum(battles) as wn8,
                                round(sum(wins)::numeric*100/sum(battles), 2) as winrate,
                                sum(damage)/sum(battles) as dpg,
                                round(sum(damage)/NULLIF(sum(damager), 0), 2) as dmg_ratio,
                                round(sum(frags)::numeric/sum(battles), 2) as frags,
                                round(sum(frags)::numeric/NULLIF((sum(battles) - sum(survived)), 0), 2) as kd,                               
                                round(sum(survived)::numeric*100/sum(battles), 2) as survived,                               
                                round(sum(spots)::numeric/sum(battles), 2) as spots
                                FROM eu.sessions WHERE tank_id = 60225 AND timestamp > 0
                                GROUP by player_id
                        ) sub
                    WHERE sub.battles > 24 LIMIT 500;
*/