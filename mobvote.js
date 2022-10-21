const Long = require('long');
const fs = require('fs');

// MobVote server plugin
// Copyright Bluebotlaboratories 2022-
// 
// TODO:
// - [ ] Implement Voting
//   - [ ] Implement Lever interaction
//   - [ ] Implement Vote Data Saving
//   - [ ] Implement Vote Response
// - [ ] Implement Parkour
//   - [ ] Implement Lever interaction
//   - [ ] Implement Button interaction
//   - [ ] Implement queue System
//   - [ ] Implement waypoint detection
//   - [ ] Implement timer
//   - [ ] Implement display system
//   - [ ] Implement leaderboard writing system
// - [ ] Implement Arena
//   - [ ] Implement zombie & skeleton spawning
//   - [ ] Implement zombie AI
//   - [ ] Implement player damage and death
//   - [ ] Implement arrows
//   - [ ] Implement skeleton AI (aimbot)
//   - [ ] Implement skeleton animation
//   - [ ] Implement zombie and skeleton damage and death
//   - [ ] Implement burning and cooling
//   - [ ] Implement points
//   - [ ] Implement item buying via points
//   - [ ] Implement potions
//   - [ ] Implement gapples
//   - [ ] Implement different swords
//   - [ ] Implement creepers

module.exports = function (server, serverData) {
  console.log("Mob Vote plugin loaded")

  // Create config file if they don't exist
  try {
    fs.mkdirSync("./plugins/mobvote/")
  } catch {}
  try {
    var pluginConfig = JSON.parse(fs.readFileSync("./plugins/mobvote/config.json"))
  } catch {
    var pluginConfig = {
      version: 2,
      rascalVoteInitialLeverStates: {
        // RASCAL
        "23_-22_5": true,
        "23_-22_6": true,
        "23_-22_7": true,
        "23_-22_10": true,
        "23_-22_11": true,
        "23_-22_12": true,
      },
      tuffVoteInitialLeverStates: {
        // TUFF
        "19_-22_16": false,
        "18_-22_16": true,
        "17_-22_16": true,
        "14_-22_16": false,
        "13_-22_16": true,
        "12_-22_16": false,
      },
      snifferVoteInitialLeverStates: {
        // SNIFFER
        "8_-22_12": false,
        "8_-22_11": false,
        "8_-22_10": false,
        "8_-22_7": false,
        "8_-22_6": false,
        "8_-22_5": true,
      }
    }
    fs.writeFileSync("./plugins/mobvote/config.json", JSON.stringify(pluginConfig))
  }
  try {
    var pluginData = JSON.parse(fs.readFileSync("./plugins/mobvote/data.json"))
  } catch {
    var pluginData = {
      version: 1,
      sniffer_parkour_leaderboard: [],
      tuffgolem_parkour_leaderboard: [],
      rascal_parkour_leaderboard: [],
      dropper_leaderboard: [],
      arena_leaderboard: [],
      sniffer_votes: [],
      tuffgolem_votes: [],
      rascal_votes: []
    }
    fs.writeFileSync("./plugins/mobvote/data.json", JSON.stringify(pluginData))
  }

  // Store runtime data
  var tmpPluginData = {
    sniffer_parkour_queue: [],
    tuffgolem_parkour_queue: [],
    rascal_parkour_queue: [],
    dropper_queue: [],
    sniffer_parkour_data: [],
    tuffgolem_parkour_data: [],
    rascal_parkour_data: [],
    dropper_data: [],
  }

  server.on('connect', client => {
    client.on('resource_pack_client_response', (data) => {
      if (data.response_status === 'completed') {
        // Show join title
        client.queue("set_title", { "type": "set_durations", "text": "", "fade_in_time": 5, "stay_time": 60, "fade_out_time": 5, "xuid": "", "platform_online_id": "" })
        client.queue("set_title", { "type": "set_title_json", "text": "{\"rawtext\":[{\"translate\":\"bb.entry.title\"}]}\n", "fade_in_time": -1, "stay_time": -1, "fade_out_time": -1, "xuid": "", "platform_online_id": "" })
      }
    })

    client.on("inventory_transaction", (data) => {
      console.log("INV TRANSAC",data)
      if (data.transaction.transaction_type === 'item_use') {
        // If it is a vote lever
        if (Object.keys(pluginConfig.snifferVoteInitialLeverStates).includes(leverKey) || Object.keys(pluginConfig.rascalVoteInitialLeverStates).includes(leverKey) || Object.keys(pluginConfig.tuffVoteInitialLeverStates).includes(leverKey)) {
          // Define lever IDs (0=off, 1=on)
          snifferVoteLeverIDs = [
            6570,
            6562
          ]
          tuffVoteLeverIDs = [
            6561,
            6569
          ]
          rascalVoteLeverIDs = [
            6562,
            6570
          ]
  
          // Bit shift y-coordinate to fix deserialization error
          data.transaction.transaction_data.block_position.y = data.transaction.transaction_data.block_position.y << 1

          // Get the lever's initial state from the config
          const leverKey = data.transaction.transaction_data.block_position.x.toString() + "_" + data.transaction.transaction_data.block_position.y.toString() + "_" + data.transaction.transaction_data.block_position.z.toString()

          // Define variables and update lever state (do not save to file as level changes are not persisstent)
          if (Object.keys(pluginConfig.snifferVoteInitialLeverStates).includes(leverKey)) {
            pluginConfig.snifferVoteInitialLeverStates[leverKey] = !pluginConfig.snifferVoteInitialLeverStates[leverKey]
            var leverStateID = snifferVoteLeverIDs[Number(pluginConfig.snifferVoteInitialLeverStates[leverKey])]
            var leverSound = pluginConfig.snifferVoteInitialLeverStates[leverKey] ? "PowerOn" : "PowerOff"
          } else if (Object.keys(pluginConfig.tuffVoteInitialLeverStates).includes(leverKey)) {
            pluginConfig.tuffVoteInitialLeverStates[leverKey] = !pluginConfig.tuffVoteInitialLeverStates[leverKey]
            var leverStateID = tuffVoteLeverIDs[Number(pluginConfig.tuffVoteInitialLeverStates[leverKey])]
            var leverSound = pluginConfig.tuffVoteInitialLeverStates[leverKey] ? "PowerOn" : "PowerOff"
          } else if (Object.keys(pluginConfig.rascalVoteInitialLeverStates).includes(leverKey)) {
            pluginConfig.rascalVoteInitialLeverStates[leverKey] = !pluginConfig.rascalVoteInitialLeverStates[leverKey]
            var leverStateID = rascalVoteLeverIDs[Number(pluginConfig.rascalVoteInitialLeverStates[leverKey])]
            var leverSound = pluginConfig.rascalVoteInitialLeverStates[leverKey] ? "PowerOn" : "PowerOff"
          }

          // Send packets to client
          client.queue('level_sound_event', {"sound_id":leverSound,"position":data.transaction.transaction_data.block_position,"extra_data":null,"entity_type":"","is_baby_mob":false,"is_global":false})
          client.queue('update_block', {"position":data.transaction.transaction_data.block_position,"block_runtime_id":leverStateID,"flags":{"_value":3,"neighbors":true,"network":true,"no_graphic":false,"unused":false,"priority":false},"layer":0})
        }
      }
    })

    client.on('player_action', (data) => {
      if (data.action === 'start_item_use_on') {
        // do nothing
      }
    })

    client.on('npc_request', (data) => {
      // Get entity data from entity id
      entityData = serverData.entities[data.runtime_entity_id]

      // Get NPC "actorID"
      const actorID = Long.fromString(entityData.unique_id)
      const actorIDList = [actorID.getHighBitsUnsigned(), actorID.getLowBitsUnsigned()]

      // unmap NPC packet enum
      const npcEnumMapping = {
        "set_actions": 0,
        "execute_action": 1,
        "execute_closing_commands": 2,
        "set_name": 3,
        "set_skin": 4,
        "set_interact_text": 5,
        "execute_openining_commands": 6
      }

      // Data for "scenetree" (Tiny Agnes's mob info dialogue)
      const sceneData = {
        "sniffer_description_scene": { "action_type": "open", "dialogue": "{\"rawtext\":[{\"translate\":\"dialog.sniffer.button.1\"},{\"text\":\"\\n\\n\"},{\"translate\":\"dialog.sniffer.button.2\"},{\"text\":\"\\n\\n\"},{\"translate\":\"dialog.sniffer.button.3\"}]}\n", "screen_name": "sniffer_description_scene", "npc_name": "{\"rawtext\":[{\"translate\":\"bb.vote.sniffer\"}]}", "action_json": "[{\"button_name\":\"{\\\"rawtext\\\":[{\\\"translate\\\":\\\"button.back\\\"}]}\",\"data\":[{\"cmd_line\":\"\",\"cmd_ver\":23}],\"mode\":0,\"text\":\"\",\"type\":1},{\"button_name\":\"\",\"data\":null,\"mode\":2,\"text\":\"\",\"type\":1},{\"button_name\":\"\",\"data\":null,\"mode\":1,\"text\":\"\",\"type\":1}]\n" },
        "tuffgolem_description_scene": { "action_type": "open", "dialogue": "{\"rawtext\":[{\"translate\":\"dialog.tuff.button.1\"},{\"text\":\"\\n\\n\"},{\"translate\":\"dialog.tuff.button.2\"},{\"text\":\"\\n\\n\"},{\"translate\":\"dialog.tuff.button.3\"}]}\n", "screen_name": "sniffer_description_scene", "npc_name": "{\"rawtext\":[{\"translate\":\"bb.vote.golem\"}]}", "action_json": "[{\"button_name\":\"{\\\"rawtext\\\":[{\\\"translate\\\":\\\"button.back\\\"}]}\",\"data\":[{\"cmd_line\":\"\",\"cmd_ver\":23}],\"mode\":0,\"text\":\"\",\"type\":1},{\"button_name\":\"\",\"data\":null,\"mode\":2,\"text\":\"\",\"type\":1},{\"button_name\":\"\",\"data\":null,\"mode\":1,\"text\":\"\",\"type\":1}]\n" },
        "rascal_description_scene": { "action_type": "open", "dialogue": "{\"rawtext\":[{\"translate\":\"dialog.rascal.button.1\"},{\"text\":\"\\n\\n\"},{\"translate\":\"dialog.rascal.button.2\"},{\"text\":\"\\n\\n\"},{\"translate\":\"dialog.rascal.button.3\"}]}\n", "screen_name": "sniffer_description_scene", "npc_name": "{\"rawtext\":[{\"translate\":\"bb.vote.rascal\"}]}", "action_json": "[{\"button_name\":\"{\\\"rawtext\\\":[{\\\"translate\\\":\\\"button.back\\\"}]}\",\"data\":[{\"cmd_line\":\"\",\"cmd_ver\":23}],\"mode\":0,\"text\":\"\",\"type\":1},{\"button_name\":\"\",\"data\":null,\"mode\":2,\"text\":\"\",\"type\":1},{\"button_name\":\"\",\"data\":null,\"mode\":1,\"text\":\"\",\"type\":1}]\n" }
      }

      // Convert enums to their integer forms
      if (typeof (data.request_type) === 'string') {
        data.request_type = npcEnumMapping[data.request_type]
      }
      if (typeof (data.action_type) === 'string') {
        data.action_type = npcEnumMapping[data.action_type]
      }

      // Handle NPC request
      if (data.request_type === 1) { // Click on button
        if (Object.keys(sceneData).includes(data.scene_name)) { // If is is in a scene that is in sceneData, then the client has probably clicked a back button
          client.queue("npc_dialogue", { "entity_id": actorIDList, "action_type": "open", "dialogue": "", "screen_name": "", "npc_name": "", "action_json": "" })
        } else if (entityData.entity_type === "mv:agnes") { // This is specific to Tiny Agnes (handle mob info dialogue)
          // Get the entity data from the entity id
          entityData = serverData.entities[data.runtime_entity_id]

          // Get the command data from the entity data
          var NPCCommandData = null;
          for (entityAttribute of entityData.metadata) {
            if (entityAttribute.key === "url_tag") {
              NPCCommandData = entityAttribute
              break;
            }
          }

          // Get button data such as command
          NPCCommandData = JSON.parse(NPCCommandData.value.replaceAll('\\n', ''))[data.action_type]
          const sceneName = NPCCommandData.data[0].cmd_line.split(' ').reverse()[0] // Get "scene" name from the command data

          //client.queue("npc_dialogue", {"entity_id":actorIDList,"action_type":2,"dialogue":"","screen_name":"","npc_name":"","action_json":""}) // (closes the dialogue box)
          client.queue("npc_dialogue", Object.assign({ "entity_id": actorIDList }, sceneData[sceneName]))
        } else if (data.action_type === 1) {
          // Close NPC's dialog first (use client.write so that when the form is displayed the NPC dialogue is completely closed)
          client.write("npc_dialogue", { "entity_id": actorIDList, "action_type": 2, "dialogue": "", "screen_name": "", "npc_name": "", "action_json": "" })

          const npcLeaderboardDataMap = {
            "mv:parkour_jens": "sniffer_parkour_leaderboard",
            "mv:arena_jens": "arena_leaderboard",
            "mv:parkour_vu": "tuffgolem_parkour_leaderboard",
            "mv:parkour_agnes": "rascal_parkour_leaderboard",
            "mv:dropper_agnes": "dropper_leaderboard"
          }
          
          const leaderboardLangMap = {
            "mv:parkour_jens": "bb.leaderboard.parkour",
            "mv:arena_jens": "bb.leaderboard.arena",
            "mv:parkour_vu": "bb.leaderboard.parkour",
            "mv:parkour_agnes": "bb.leaderboard.parkour",
            "mv:dropper_agnes": "bb.leaderboard.dropper"
          }

          // Get string leaderboard format from data
          const leaderboardData = pluginData[npcLeaderboardDataMap[entityData.entity_type]]

          if (leaderboardData.length > 0) {
            var leaderboardString = ""
            var i = 1
            for (const player of leaderboardData) {
              leaderboardString += i.toString() + ". " + player.scoreData + " - " + player.username + "\n"
              i++
            }

            // Only 12 lines, use 13 bc i starts at 1
            leaderboardString += "\n".repeat(13-i)
            //leaderboardString += "\n\n\n"
          } else {
            var leaderboardString = "bb.leaderboard.none"
          }

          setTimeout(() => {
            // Send leaderboard form
            const formData = { "buttons": [{ "image": null, "text": "bb.leaderboard.button.close" }], "content": leaderboardString, "title": leaderboardLangMap[entityData.entity_type], "type": "form" }
            client.queue("modal_form_request", { "form_id": 3, "data": JSON.stringify(formData) })
          }, 100) // (Wait 100ms just to be safe)
        } else if (data.action_type === 0) {
          // TODO: Implement queues
        }
      } else if (data.request_type === 6) { // Run NPC open commands
        // Sound mappings for NPCs
        entitySounds = {
          "mv:jens": "entity.jens.random",
          "mv:parkour_jens": "entity.jens.random",
          "mv:snorkel_jens": "entity.jens.random",
          "mv:arena_jens": "entity.jens.random",
          "mv:vu": "entity.vu.random",
          "mv:parkour_vu": "entity.vu.random",
          "mv:detective_vu": "entity.vu.random",
          "mv:agnes": "entity.agnes.random",
          "mv:parkour_agnes": "entity.agnes.random",
          "mv:snorkel_agnes": "entity.agnes.random",
          "mv:dropper_agnes": "entity.agnes.random"
        }

        // If the NPC has a sound mapping, play the corresponding sound
        if (Object.keys(entitySounds).includes(entityData.entity_type)) {
          // Convert regular entity position to strange sound packet position
          const soundPacketPosition = {
            "x": (8 * entityData.position.x) + 4,
            "y": (8 * entityData.position.y),
            "z": (8 * entityData.position.z) + 4
          }

          client.queue("play_sound", { "name": entitySounds[entityData.entity_type], "coordinates": soundPacketPosition, "volume": 1, "pitch": 1 })
        }
      }
    })

    // Debug Commands
    client.on('command_request', (data) => {
      commandData = data.command.split(' ')
      try {
        switch (commandData[0]) {
        }
      } catch (e) {
        console.error(e)
      }
    })
  })
}