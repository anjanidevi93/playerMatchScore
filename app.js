const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const convertPlayerTableToObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetailsToObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayers = `select * from player_details;`;
  const player = await db.all(getPlayers);
  response.send(
    player.map((eachPlayer) => convertPlayerTableToObject(eachPlayer))
  );
});
//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `select * from player_details
    where player_id=${playerId};`;
  const details = await db.get(getPlayer);
  response.send(convertPlayerTableToObject(details));
});
//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updateName = `update
    player_details
    set
    player_name='${playerName}'
    where player_id=${playerId};`;
  const player = await db.run(updateName);
  response.send("Player Details Updated");
});
//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `select * from match_details
    where match_id=${matchId};`;
  const match = await db.get(getMatchDetails);
  response.send(convertMatchDetailsToObject(match));
});
//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const allMatches = `select * from
    player_match_score natural join match_details
    where
    player_id=${playerId};`;
  const matches = await db.all(allMatches);
  response.send(
    matches.map((eachMatch) => convertMatchDetailsToObject(eachMatch))
  );
});
//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const allPlayers = `select * from player_match_score natural join
   player_details
   where match_id=${matchId};`;
  const players = await db.all(allPlayers);
  response.send(
    players.map((eachPlayer) => convertPlayerTableToObject(eachPlayer))
  );
});
//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const totalScores = `select
    player_id as playerId,
    player_name as playerName,
    sum(score) as totalScore,
    sum(fours) as totalFours,
    sum(sixes) as totalSixes
    from player_match_score natural join player_details
    where player_id=${playerId};`;
  const playerMatchDetails = await db.get(totalScores);
  response.send(playerMatchDetails);
});
module.exports = app;
