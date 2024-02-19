const mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Schéma pour la prise de rendez-vous
var rendezvousSchema = new Schema({
    date: { type: Date, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'utilisateur' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'service' },
    employe: { type: mongoose.Schema.Types.ObjectId, ref: 'utilisateur' },
    etat: { type: Number, default: 0 }
    // ... d'autres champs pour la gestion du rendez-vous
});

module.exports = mongoose.model('rendezvous', rendezvousSchema);