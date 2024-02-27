const mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Schéma pour les dépenses
var depenseSchema = new Schema({
    nom: { type: String, required: true },
    montant: { type: Number, required: true }
    // ... d'autres champs pour la gestion des dépenses
});

module.exports = mongoose.model('depense', depenseSchema);