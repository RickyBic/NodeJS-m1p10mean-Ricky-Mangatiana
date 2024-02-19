const mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Schéma pour la gestion des horaires de travail
var horairetravailSchema = new Schema({
    heureDebut: { type: Number, required: true },
    heureFin: { type: Number, required: true },
    jourSemaine: { type: Number, required: true } // [0] Dimanche >> [1] Lundi >> [2] Mardi >> [3] Mercredi ...
    // ... d'autres champs pour la gestion des horaires de travail
});

module.exports = mongoose.model('horairetravail', horairetravailSchema);