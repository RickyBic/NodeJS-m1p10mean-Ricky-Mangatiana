const mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Schéma pour la gestion des services
var serviceSchema = new Schema({
    nom: { type: String, required: true },
    image: { type: String },
    prix: { type: Number, required: true },
    duree: { type: Number, required: true }, // Durée en minutes
    commission: { type: Number, default: 0.2 } // Taux de commission de 20 % (ajuster si nécessaire)
    // ... d'autres champs pour la gestion des services
});

module.exports = mongoose.model('service', serviceSchema);