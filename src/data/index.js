const { Schema, model, connect } = require('mongoose');
const { config } = require('../config');

function connectToDB() {
    connect(config.mongo_db, { useNewUrlParser: true, useUnifiedTopology: true, autoIndex: false });
}

const inviSchema = new Schema({
    twitchChannel: { type: String, index: true, unique: true},
    guildID: String,
    inviteOptions: {
        maxUses: Number,
        maxAge: Number,
        creatorRole: String
    }
});

const Invi = model('Invi', inviSchema);
Invi.createIndexes();

const roleSchema = new Schema({
    guildID: { type: String, index: true, unique: true },
    roleID: String
});

const Role = model('Role', roleSchema);
Role.createIndexes();

const lastInviteSchema = new Schema({
    twitchChannel: { type: String, index: true, unique: true },
    code: { type: String, index: true, unique: true }
});

const LastInvite = model('LastInvite', lastInviteSchema);
LastInvite.createIndexes();

class Repository {

    /**
     * @param {String} twitchChannel
     * @returns { { twitchChannel: String, guildID: String, inviteOptions: { maxUses: Number, maxAge: Number, creatorRole: String } } }
     */
    async getInviByChannel(twitchChannel) {
        const document = await Invi.findOne({ twitchChannel }).exec();
        return document;
    }

    /**
     * @returns {String[]}
     */
    async getAllChannels() {
        const documents = await Invi.find({}).exec();
        return documents.map(invi => invi.twitchChannel);
    }

    /**
     * 
     * @param {String} guildID 
     */
    async getChannelsByGuild(guildID) {
        const documents = await Invi.find({ guildID }).exec();
        return documents.map(invi => invi.twitchChannel);
    }

    /**
     * 
     * @param {String} twitchChannel 
     * @param {String} guildID 
     * @param {Number} maxUses 
     * @param {Number} maxAge 
     * @returns {Promise<Document | any>}
     */
    async createInvi(twitchChannel, guildID, maxUses, maxAge) {
        const invi = new Invi({
            twitchChannel,
            guildID,
            inviteOptions: {
                maxUses,
                maxAge
            }
        });
        return new Promise((resolve, reject) => {
            invi.save((err, item) => {
                if(err) reject(err);
                resolve(item);
            });
        });
    }

    /**
     * 
     * @param {String} twitchChannel 
     * @param {Number} maxUses 
     * @param {Number} maxAge 
     * @returns {Promise<Invi | Any>}
     */
    async updateInvi(twitchChannel, maxUses, maxAge) {
        let error = undefined;
        const query = Invi.findOneAndUpdate({ twitchChannel }, { inviteOptions: { maxUses, maxAge } }, { useFindAndModify: false }, (err) => {
            if(err) error = err;
        });
        const result = await query.exec();
        if(error) {
            return Promise.reject(error);
        } else {
            return Promise.resolve(result);
        }
    }

    /**
     *  
     * @param {String} twitchChannel 
     * @returns {Promise<Boolean>}
     */
    async removeInvi(twitchChannel) {
        const result = await Invi.deleteOne({ twitchChannel }).exec();
        return Promise.resolve(result.deletedCount === 1);
    }

    /**
     * 
     * @param {String} guildID
     * @returns {Promise<Boolean>}
     */
    async removeInvis(guildID) {
        const result = await Invi.deleteMany({ guildID }).exec();
        return Promise.resolve(result.deletedCount > 0);
    }

    /**
     * 
     * @param {String} guildID 
     * @returns {String}
     */
    async getRole(guildID) {
        const document = await Role.findOne({ guildID }).exec();
        if(document !== null && document !== undefined) {
            return document.roleID;
        } else {
            return '';
        }
    }

    /**
     * 
     * @param {String} guildID 
     * @param {String} roleID 
     */
    async setRole(guildID, roleID) {
        let error = undefined;
        const query = Role.updateOne({ guildID }, { roleID }, { upsert: true }, (err) => {
            if(err) error = err;
        });
        await query.exec();
        if(error) {
            return Promise.reject(error);
        } else {
            return Promise.resolve();
        }
    }

    /**
     * 
     * @param {String} guildID 
     */
    async removeRole(guildID) {
        const result = await Role.deleteOne({ guildID }).exec();
        return Promise.resolve(result.deletedCount === 1);
    }

    /**
     * 
     * @param {String} twitchChannel 
     */
    async getLastInvite(twitchChannel) {
        const document = await LastInvite.findOne({ twitchChannel }).exec();
        if(document !== null && document !== undefined) {
            return document.code;
        } else {
            return '';
        }
    }

    /**
     * 
     * @param {String} twitchChannel 
     * @param {String} inviteCode 
     */
    async setLastInvite(twitchChannel, inviteCode) {
        let error = undefined;
        const query = LastInvite.updateOne({ twitchChannel }, { code: inviteCode }, { upsert: true }, (err) => {
            if(err) error = err;
        });
        await query.exec();
        if(error) {
            return Promise.reject(error);
        } else {
            return Promise.resolve();
        }
    }

    /**
     * 
     * @param {String} inviteCode 
     */
    async removeLastInvite(inviteCode) {
        const result = await LastInvite.deleteOne({ code: inviteCode }).exec();
        return Promise.resolve(result.deletedCount === 1);
    }

}

exports.connectToDB = connectToDB;
exports.Repository = Repository;