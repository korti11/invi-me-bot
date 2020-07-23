const { Schema, model, connect } = require('mongoose');

function connectToDB() {
    connect(process.env.MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true, autoIndex: false });
}

const inviSchema = new Schema({
    twitchChannel: { type: String, index: true, unique: true},
    guildID: Number,
    inviteOptions: {
        maxUses: Number,
        maxAge: Number,
        creatorRole: String
    }
});

const Invi = model('Invi', inviSchema);
Invi.createIndexes();

const roleSchema = new Schema({
    guildID: { type: Number, index: true, unique: true },
    roleID: String
});

const Role = model('Role', roleSchema);
Role.createIndexes();

class Repository {

    /**
     * @param {String} twitchChannel
     * @returns {Promise<Document>}
     */
    async getInviByChannel(twitchChannel) {
        return Promise.resolve((resolve) => {
            Invi.findOne({ twitchChannel }, (res) => {
                resolve(res);
            });
        });
    }

    /**
     * 
     * @param {String} twitchChannel 
     * @param {Number} guildID 
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
        const query = Invi.deleteOne({ twitchChannel }, (err) => {
            if(err) return Promise.reject(err);
        });
        const result = await query.exec();
        return Promise.resolve(result.ok === 1);
    }

    /**
     * 
     * @param {Number} guildID 
     * @returns {String}
     */
    async getRole(guildID) {
        return new Promise((res, rej) => {
            Role.findOne({ guildID }, (err, doc) => {
                if(err) rej(err);
                res(doc.roleID);
            });
        });
    }

    /**
     * 
     * @param {Number} guildID 
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

}

exports.connectToDB = connectToDB;
exports.Repository = Repository;