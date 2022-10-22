const Long = require('long');

module.exports = function (server, serverData) {
  console.log("Vanilla Commands plugin loaded")

    server.on('connect', client => {
        client.on('command_request', (data) => {
            commandData = data.command.split(' ')
            //console.log(data)

            //console.log(JSON.stringify(client, (key, value) => {
            //  if (["server", "_idlePrev", "_idleNext", "_writableState"].includes(key)) {
            //    return null
            //  } else if (typeof value === 'bigint') {
            //    return value.toString()
            //  } else {
            //    return value
            //  }
            //}))
      
            try {
              switch (commandData[0]) {
                case "/stop": // Stops the server
                  client.disconnect("The Server Has Stopped")
                  client.close()
                  exit()
                case "/gamemode":
                  console.log(data.origin)
                  client.queue("set_player_game_type", {"gamemode":commandData[1]})
                  client.queue("command_output", {"origin":{"type":"player","uuid":client.profile.uuid,"request_id":""},"output_type":"all","success_count":1,"output":[{"success":true,"message_id":"commands.gamemode.success.self","parameters":["%createWorldScreen.gameMode." + commandData[1].toLowerCase()]}]})
                  break
                case "/tp":
                  client.queue("move_player", {"runtime_id":serverData.players[client.profile.uuid].runtime_entity_id,"position":{"x":commandData[1],"y":commandData[2],"z":commandData[3]},"pitch":0,"yaw":0,"head_yaw":0,"mode":"teleport","on_ground":false,"ridden_runtime_id":0,"teleport":{"cause":"command","source_entity_type":1},"tick":"0"})
                  client.queue("command_output", {"origin":{"type":"player","uuid":data.origin.uuid,"request_id":""},"output_type":"all","success_count":1,"output":[{"success":true,"message_id":"commands.tp.success.coordinates","parameters":[client.profile.name, commandData[1], commandData[2], commandData[3]]}]})
                  break
                case "/time":
                  switch (commandData[1]) {
                    case "set":
                      client.queue("set_time", {"time": Number.parseInt(commandData[2])})
                      break
                  }
                  break
              }
            } catch (e) {
              console.error(e)
            }
        })
    })
}