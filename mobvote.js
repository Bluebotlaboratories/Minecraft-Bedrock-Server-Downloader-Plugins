const Long = require('long');
const fs = require('fs');

module.exports = function (server, serverData) {
  console.log("Mob Vote plugin loaded")

  // Create config file if they don't exist
  try {
    fs.mkdirSync("./plugins/mobvote/")
  } catch {}
  try {
    var pluginConfig = fs.readFileSync("./plugins/mobvote/config.json")
  } catch {
    var pluginConfig = {}
    fs.writeFileSync("./plugins/mobvote/config.json", JSON.stringify(pluginConfig))
  }
  try {
    var pluginData = fs.readFileSync("./plugins/mobvote/data.json")
  } catch {
    var pluginData = {
      sniffer_parkour_leaderboard: [],
      tuffgolem_parkour_leaderboard: [],
      rascal_parkour_leaderboard: [],
      dropper_parkour_leaderboard: [],
      sniffer_votes: [],
      tuffgolem_votes: [],
      rascal_votes: []
    }
    fs.writeFileSync("./plugins/mobvote/data.json", JSON.stringify(pluginData))
  }

  server.on('connect', client => {
    client.on('resource_pack_client_response', (data) => {
      if (data.response_status === 'completed') {
        // Show join title
        client.queue("set_title", { "type": "set_durations", "text": "", "fade_in_time": 5, "stay_time": 60, "fade_out_time": 5, "xuid": "", "platform_online_id": "" })
        client.queue("set_title", { "type": "set_title_json", "text": "{\"rawtext\":[{\"translate\":\"bb.entry.title\"}]}\n", "fade_in_time": -1, "stay_time": -1, "fade_out_time": -1, "xuid": "", "platform_online_id": "" })
      }
    })

    client.on('level_sound_event', (data) => {
      console.log(data)
    })

    client.on('npc_request', (data) => {
      const entityData = serverData.entities[data.runtime_entity_id]

      // Get NPC "actorID"
      const actorID = Long.fromString(entityData.unique_id)
      const actorIDList = [actorID.getHighBitsUnsigned(), actorID.getLowBitsUnsigned()]

      console.log("NPC REQUEST", data)
      const npcEnumMapping = {
        "set_actions": 0,
        "execute_action": 1,
        "execute_closing_commands": 2,
        "set_name": 3,
        "set_skin": 4,
        "set_interact_text": 5,
        "execute_openining_commands": 6
      }

      // Data for "scenetree"
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
        } else if (entityData.entity_type === "mv:agnes") { // This is specific to agnes
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

          //client.queue("npc_dialogue", {"entity_id":actorIDList,"action_type":2,"dialogue":"","screen_name":"","npc_name":"","action_json":""})
          client.queue("npc_dialogue", Object.assign({ "entity_id": actorIDList }, sceneData[sceneName]))
        } else if (data.action_type === 1) {
          console.log("Sending form request")
          // Close NPC's dialog first
          client.queue("npc_dialogue", { "entity_id": actorIDList, "action_type": 2, "dialogue": "", "screen_name": "", "npc_name": "", "action_json": "" })

          // Wait for dialogue to be completely closed or it doesn't work
          setTimeout(() => {
            const formData = { "buttons": [{ "image": null, "text": "Close window" }], "content": "1. 0.05 - Test\n2.\n3.\n4.\n5.\n6.\n7.\n8.\n9.\n10.\n\n\n", "title": "Dropper Leaderboard", "type": "form" }
            client.queue("modal_form_request", { "form_id": 3, "data": JSON.stringify(formData) })
          }, 500)
        }
      } else if (data.request_type === 6) { // Open commands
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

        // Convert regular position to strange sound packet position
        const soundPacketPosition = {
          "x": (8 * entityData.position.x) + 4,
          "y": (8 * entityData.position.y),
          "z": (8 * entityData.position.z) + 4
        }

        if (Object.keys(entitySounds).includes(entityData.entity_type)) {
          client.queue("play_sound", { "name": entitySounds[entityData.entity_type], "coordinates": soundPacketPosition, "volume": 1, "pitch": 1 })
        }
      }
    })

    client.on('command_request', (data) => {
      commandData = data.command.split(' ')

      try {
        switch (commandData[0]) {
          case "/formtest":
            const formData = { "buttons": [{ "image": null, "text": "Close window" }], "content": "1. 0.05 - Me\n2. 0.05 - Also me\n3. 0.05 - This is a test\n4. 0.05 - These aren't real players\n5. 0.05 - Me\n6. 0.05 - Also me\n7. 0.05 - This is a test\n8. 0.05 - These aren't real players\n9.\n10.\n\n\n", "title": "Dropper Leaderboard", "type": "form" }
            client.queue("modal_form_request", { "form_id": 3, "data": JSON.stringify(formData) })
            break
        }
      } catch (e) {
        console.error(e)
      }
    })
  })
}