const {MessageEmbed} = require('discord.js')

module.exports.getGenericEmbed = function (name, description, footer) {
    const returnEmbed = new MessageEmbed().setColor('#0099ff').setTitle(name).setDescription(description);
    if (typeof footer !== 'undefined' && typeof footer === 'string') {
        returnEmbed.setFooter(footer);
    }
    return returnEmbed;
}