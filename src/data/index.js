const { Schema, model, connect } = require('mongoose');

function connectToDB() {
    connect(process.env.MONGO_DB, { useNewUrlParser: true, useUnifiedTopology: true });
}

const inviSchema = new Schema({
    twitchChannel: { type: String, index: true, unique: true},
    guildID: Number,
    inviteOptions: {
        maxUses: Number,
        maxAge: Number
    }
}, { autoIndex: false });

const Invi = model('Invi', inviSchema);
Invi.createIndexes();

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
        const query = Invi.findOneAndUpdate({ twitchChannel }, { inviteOptions: { maxUses, maxAge } }, { useFindAndModify: false }, (err) => {
            if(err) return Promise.reject(err);
        });
        const result = await query.exec();
        return Promise.resolve(result);
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

}

exports.connectToDB = connectToDB;
exports.Invi = Invi;
exports.Repository = Repository;