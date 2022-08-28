const permissions = ["ADMINISTRATOR"]
const { v4: uuidv4 } = require('uuid');

const command = {
	execute: function execute(interaction, client, db) {
		if (!interaction.memberPermissions.any(permissions, true)) {
			interaction.reply("This command is not for you!")
			return
		}

		//- /create 
  let modal = {
  "title": "Create an application",
  "custom_id": "create",
  "components": [{
    "type": 1,
    "components": [{
      "type": 4,
      "custom_id": "title",
      "label": "Application name",
      "style": 1,
      "min_length": 0,
      "max_length": 200,
      "placeholder": "",
      "required": true
    }]
  },
                 {
    "type": 1,
    "components": [{
      "type": 4,
      "custom_id": "description",
      "label": "Application description",
      "style": 2,
      "min_length": 0,
      "max_length": 4000,
      "placeholder": "",
      "required": true
    }]
  },
                 {
    "type": 1,
    "components": [{
      "type": 4,
      "custom_id": "rankRequirement",
      "label": "Rank requirement",
      "style": 2,
      "min_length": 0,
      "max_length": 4000,
      "placeholder": "The allowed ranks ids separated by semi-colons (;)",
      "required": true
    }]
  }
                
                
                
                ]
}
		interaction.showModal(modal)
		interaction.awaitModalSubmit({
			time: 60000,
			filter: i => (i.user.id === interaction.user.id && i.customId === "create") ,
		}).catch(error => {
			console.error(error)
			return null
		})
    .then(i=>{
      if (!i){return}
      const uuid = uuidv4()
       db.collection('applicationData').doc(uuid).set({
         "name":i.fields.fields.get('title').value,
         "description":i.fields.fields.get('description').value,
         "rankRequirement":i.fields.fields.get('rankRequirement').value.split(";")
       }).then(i.reply({
         content: `New application created ! \n\n**UUID:** ${uuid}`
       }))
      
    })
	}
}

module.exports = command