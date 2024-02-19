const mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Schéma pour les informations de l'utilisateur
var utilisateurSchema = new Schema({
    profil: { type: Number, required: true }, // [0] Manager >> [1] Employé >> [2] Client
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    motDePasse: { type: String, required: true },
    preferences: { // Pour les clients
        servicePrefere: { type: mongoose.Schema.Types.ObjectId, ref: 'service' },
        employePrefere: { type: mongoose.Schema.Types.ObjectId, ref: 'utilisateur' }
    },
    horairestravail: [{ type: mongoose.Schema.Types.ObjectId, ref: 'horairetravail' }], // Pour les employés
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'service' }], // Pour les employés
    // ... d'autres champs pour les notifications, rappels, etc.
});

module.exports = mongoose.model('utilisateur', utilisateurSchema);