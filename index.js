const express = require('express')
const app = express()
app.use(express.json())

//if no login --> kill 1

const {
	initializeApp,
	applicationDefault,
	cert
} = require('firebase-admin/app');
const {
	getFirestore,
	Timestamp,
	FieldValue
} = require('firebase-admin/firestore');
const Discord = require("discord.js")
const { v4: uuidv4 } = require('uuid');

const port = 3000

const SERVER_KEY = "yuRjWgs3vUXz7GMpXxStgLFBNQF6za3NvQur26tT6QRNbuXZVhaKfrgNXPaM9n9UWX5J8mtLca2dNPvuktu8yKPdcpMfPBZewtJr9G5st9MUmcD6CXdtpKgP"

const {
	Client,
	GatewayIntentBits
} = require('discord.js');
const client = new Client({
	intents: [GatewayIntentBits.Guilds]
});

const serviceAccount = require("./serviceAccount.json")


let guild, channel

const failIps = []
initializeApp({
	credential: cert(serviceAccount)
});
const db = getFirestore();
 db.collection('applications').doc("testDoc").set({"test":"1v1"})


function resolveRequest(code, message, res) {
	console.log("Resolving request:", code, message)
	res.status(code)
	res.send(message)
}
function showBooleanEntry(value){
  
}

function securityFunction(req, res) {
	let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	let counter = failIps[ip]

	if (counter >= 5) {
		resolveRequest(403, "Forbidden", res)
		return false
	}

	if (req.body.key != SERVER_KEY) {
		resolveRequest(403, "Forbidden", res)
			(counter == undefined) ? (failIps[ip] = 1) : (failIps[ip] += 1);
		return false
	} else {
		return true
	}
}


app.post('/apply', (req, res) => {
	//console.log(req.body)
	if (securityFunction(req, res) == false) {
		return
	}

	let body = req.body

	client.guilds.fetch(body.discord.guildId)
		.then((guild) => {
			if (!guild) {
				resolveRequest(404, "Guild was not found using the provided guild ID", res);
				return
			}

			guild.channels.fetch(body.discord.channelId).then((channel) => {
					if (!channel) {
						resolveRequest(404, "Channel was not found using the provided channel ID", res);
						return
					}

					let fields = []

					for (let i = 0; i < body.data.length; i++) {
						let field = body.data[i]
						fields.push({
							"name": field.title,
							"value": field.answer
						})
					}

          let uuid = uuidv4();
					channel.send({
						embeds: [{
							"title": `New Application - ${body.name}`,
							"description": `**${body.player.displayName}** (${body.player.name}) - *${body.player.age} days*
       
**Application id:** ${uuid}
**Status:** Waiting for review

__**Questions:**__`,
							"fields": fields,
							"timestamp": (new Date(body.timestamp)),
              "color":14122520,
    						}],
            
            "components": [
        {
            "type": 1,
            "components": [
              {
                    "type": 2,
                    "label": "Accept",
                    "style": 3,
                    "custom_id": "accept_"+uuid
                },
              {
                    "type": 2,
                    "label": "Deny",
                    "style": 4,
                    "custom_id": "deny_"+uuid
                },
            ]
        }
    ]
					}).then(() => {
            body.status = 1
            db.collection('applications').doc(uuid).set(body).then(()=>{
              resolveRequest(200, "Application succesfully submitted", res)
            })
						.catch((err)=>{
              console.log(err)
              resolveRequest(500, "Failed to send the application into firestore", res)
            })
					})
				})

				.catch((err) => {
          console.log(err)
					resolveRequest(404, "Error while fetching channel from channel ID", res);
					return
				})
		})
		.catch((err) => {
      console.log(err)
			resolveRequest(404, "Error while fetching guild from guid ID", res);
			return
		})



})

app.post('/update', (req, res) => {
	if (securityFunction(req, res) == false) {
		return
	}

})

client.on("interactionCreate", function(interaction) {
  if(interaction.isCommand()){
    let command = require("./commands/"+interaction.commandName+".js")
    if(!command){
      interaction.reply("Command not found !")
      return
    }else{
      console.log("Executing ", interaction.commandName)
      command.execute(interaction,client,db)
      return
    }
  }
  let identifier = interaction.customId.split("_")[0]
  let uuid = interaction.customId.split("_")[1]
  console.log(identifier,uuid)
  if(!["deny","accept","denyreason"].includes(identifier)){return}
  
  if(identifier == "deny"){
    let modal = {
  "title": "Denial reason",
  "custom_id": "denyreason_"+uuid,
  "components": [{
    "type": 1,
    "components": [{
      "type": 4,
      "custom_id": "reasonText",
      "label": "Reason",
      "style": 2,
      "min_length": 0,
      "max_length": 4000,
      "placeholder": "No reason provided",
      "required": true
    }]
  }]
}
    interaction.showModal(modal)
  }else if(identifier == "accept"){
    db.collection('applications').doc(uuid).set({
    status: identifier == "denyreason" ? 0 : 2,
    reviewer: interaction.user.id,
    reason: ""
  },{merge:true}).then(()=>{
    const  embed = {
      fields: interaction.message.embeds[0].fields,
      timestamp: interaction.message.embeds[0].timestamp
    }
    embed.title = interaction.message.embeds[0].title
    embed.color = (identifier == "denyreason") ? 14096408 : 3331864,
    embed.description = interaction.message.embeds[0].description.replace("Waiting for review",`Accepted by <@${interaction.user.id}>`)

    interaction.message.edit({embeds:[embed], components: []}).then(interaction.reply({content:"Action saved",ephemeral:true}))
  })
  }else if(identifier == "denyreason"){
    db.collection('applications').doc(uuid).set({
    status: identifier == "denyreason" ? 0 : 2,
    reviewer: interaction.user.id,
    reason: interaction.fields.getTextInputValue("reasonText")
  },{merge:true}).then(()=>{
    const  embed = {
      fields: interaction.message.embeds[0].fields,
      timestamp: interaction.message.embeds[0].timestamp
    }
    embed.title = interaction.message.embeds[0].title
    embed.color = (identifier == "denyreason") ? 14096408 : 3331864,
    embed.description = interaction.message.embeds[0].description.replace("Waiting for review",`Denied by <@${interaction.user.id}> \n **Reason: **${interaction.fields.getTextInputValue("reasonText")}`)

    interaction.message.edit({embeds:[embed], components: []}).then(interaction.reply({content:"Action saved",ephemeral:true}))
  })
  }
  
  

  
  //interaction.reply({content:`${identifier} on application ID: ${uuid}`,ephemeral:true})
});

client.on("ready", () => {
	console.log("Discord client ready")
});

app.listen(port, () => {
	client.login(process.env.DISCORD_TOKEN);
	console.log(`Example app listening on port ${port}`)
})