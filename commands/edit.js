const permissions = ["ADMINISTRATOR"];
const { v4: uuidv4 } = require("uuid");
const djs = require("discord.js");

const command = {
  execute: function execute(interaction, client, db) {
    if (!interaction.memberPermissions.any(permissions, true)) {
      interaction.reply("This command is not for you!");
      return;
    }

    let uuid = interaction.options.getString("uuid");
    db.collection("applicationData")
      .doc(uuid)
      .get()
      .then((doc) => {
        if (doc.exists) {
          doc = doc.data();
          let fieldString = "";
          if (doc.fields != undefined) {
            doc.fields.forEach((field) => {
              fieldString += `\n**Title:**${field.title}\n**Description:**${field.description}\n**Input Type:**${field.dataType}`;
            });
          }
          interaction.reply({
            content: "Menu sent!",
            ephemeral: true,
          });
          interaction.channel
            .send({
              embeds: [
                {
                  title: `Edit menu - ${uuid}`,
                  description: `**Application Name:** ${doc.name}\n**Description:**${doc.description}\n**Required Ranks:**${doc.rankRequirement.toString()}\n\n**Fields**${fieldString}`,
                  color: 2646071,
                },
              ],

              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      label: "Add field",
                      style: 3,
                      custom_id: "addfielde_" + uuid,
                    },
                    {
                      type: 2,
                      label: "Remove field",
                      style: 4,
                      custom_id: "removefielde_" + uuid,
                    },
                  ],
                },
                {
                  type: 1,
                  components: [
                    {
                      type: 1,
                      label: "Edit Allowed ranks",
                      style: 3,
                      custom_id: "rre_" + uuid,
                    },
                    {
                      type: 1,
                      label: "Edit Information",
                      style: 3,
                      custom_id: "infoe_" + uuid,
                    },
                  ],
                },
                {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      label: "Delete Application",
                      style: 4,
                      custom_id: "deletee_" + uuid,
                    },
                  ],
                },
              ],
            })
            .then((message) => {
              const filter = (i) => {
                i.deferUpdate();
                return i.user.id === interaction.user.id;
              };

              message
                .awaitMessageComponent({
                  filter,
                  componentType: djs.ComponentType.Button,
                  time: 60000,
                })
                .then((i) => {
                  let cid = interaction.customId.split("_")[0];
                  let uuid = interaction.customId.split("_")[1];

                  if (cid == "deletee") {
                    db.collection("applicationData")
                      .doc(uuid)
                      .delete()
                      .then(() => {
                        i.reply("Application succesfully deleted");
                      })
                      .catch((error) => {
                        i.reply("Error removing document: " + error);
                      });
                  } else if (cid == "infoe") {
                    let modal = {
                      title: "Edit application information",
                      custom_id: "infoem",
                      components: [
                        {
                          type: 1,
                          components: [
                            {
                              type: 4,
                              custom_id: "title",
                              label: "Application name",
                              style: 1,
                              min_length: 0,
                              max_length: 200,
                              placeholder: doc.name,
                              required: true,
                            },
                          ],
                        },
                        {
                          type: 1,
                          components: [
                            {
                              type: 4,
                              custom_id: "description",
                              label: "Application description",
                              style: 2,
                              min_length: 0,
                              max_length: 4000,
                              placeholder: doc.description,
                              required: true,
                            },
                          ],
                        },
                        {
                          type: 1,
                          components: [
                            {
                              type: 4,
                              custom_id: "rankRequirement",
                              label: "Rank requirement",
                              style: 2,
                              min_length: 0,
                              max_length: 4000,
                              placeholder: doc.rankRequirement ? doc.rankRequirement.join(";") : "",
                              required: true,
                            },
                          ],
                        },
                      ],
                    };

                    i.showModal(modal).then(() => {
                      i.awaitModalSubmit({
                        time: 60000,
                        filter: (i2) => i2.user.id === i.user.id && i2.customId === "infoem",
                      })
                        .catch((error) => {
                          console.error(error);
                          i.reply("An error occured: "+error)
                        })
                        .then((modalInteraction) => {
                          if (!modalInteraction) {
                            return;
                          }
                          db.collection("applicationData")
                            .doc(uuid)
                            .set({
                              name: modalInteraction.fields.fields.get("title").value == "" ? doc.title : modalInteraction.fields.fields.get("title").value,
                              description: modalInteraction.fields.fields.get("description").value == "" ? doc.title : modalInteraction.fields.fields.get("description").value,
                              rankRequirement: modalInteraction.fields.fields.get("rankRequirement").value == "" ? doc.rankRequirement.join(";") : modalInteraction.fields.fields.get("rankRequirement").value.split(";"),
                            },{merge:true})
                            .then(
                              i.reply({
                                content: `**Application Information edited**\n**Name:**${modalInteraction.fields.fields.get("title").value == "" ? doc.title : modalInteraction.fields.fields.get("title").value}\n**Description:**${modalInteraction.fields.fields.get("description").value == "" ? doc.title : modalInteraction.fields.fields.get("description").value}\n**Required ranks:**${modalInteraction.fields.fields.get("rankRequirement").value == "" ? doc.rankRequirement.join(";") : modalInteraction.fields.fields.get("rankRequirement").value.split(";")}`,
                              })
                            );
                        });
                    });
                  }
                })
                .catch((err) => console.log(err));
            });
        } else {
          interaction.reply(`No application was found with the uuid: ${uuid}, use /create to create one`);
        }
      })
      .catch((error) => {
        interaction.reply("Error getting document:"+ error);
      });
  },
};

module.exports = command;
