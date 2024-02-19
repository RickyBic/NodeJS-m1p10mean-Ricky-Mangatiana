const express = require("express");
const router = express.Router();
const moment = require('moment');
var utilisateurModel = require('../src/model/utilisateur');
var serviceModel = require('../src/model/service');
var horairetravailModel = require('../src/model/horairetravail');
var rendezvousModel = require('../src/model/rendezVous');

/*----------Gestion-du-personnel----------*/
router.post('/utilisateur', async (req, res) => {
    const utilisateur = new utilisateurModel(req.body);
    try {
        await utilisateur.save();
        res.status(201).send({
            "status": true,
            "message": "Utilisateur ajouté"
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/utilisateurs/employes', async (req, res) => {
    try {
        const utilisateurs = await utilisateurModel.find({
            "profil": 1 // [1] Employé
        });
        res.status(200).send(utilisateurs);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/utilisateurs/:_id', async (req, res) => {
    try {
        const _id = req.params._id;
        const utilisateur = await utilisateurModel.findById(_id);
        return !utilisateur ? res.status(404).send() : res.status(200).send(utilisateur);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.put('/utilisateurs/:_id', async (req, res) => {
    try {
        const _id = req.params._id;
        const body = req.body;
        const utilisateur = await utilisateurModel.findByIdAndUpdate(_id, body, { new: true });
        return !utilisateur ? res.status(404).send() : res.status(200).send({ "status": true, "message": "Utilisateur modifié" });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete('/utilisateurs/:_id', async (req, res) => {
    try {
        const _id = req.params._id;
        const utilisateur = await utilisateurModel.findByIdAndDelete(_id);
        return !utilisateur ? res.status(404).send() : res.status(200).send({ "status": true, "message": "Utilisateur supprimé" });
    } catch (error) {
        res.status(500).send(error);
    }
});
/*----------Gestion-du-personnel----------*/


/*----------Gestion-des-horaires-de-travail----------*/
router.post('/horairetravail', async (req, res) => {
    const horairetravail = new horairetravailModel(req.body);
    try {
        await horairetravail.save();
        res.status(201).send({
            "status": true,
            "message": "Horaire de travail ajouté"
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/horairestravail', async (req, res) => {
    try {
        const horairestravail = await horairetravailModel.find({});
        res.status(200).send(horairestravail);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.put('/horairestravail/:_id', async (req, res) => {
    try {
        const _id = req.params._id;
        const body = req.body;
        const horairetravail = await horairetravailModel.findByIdAndUpdate(_id, body, { new: true });
        return !horairetravail ? res.status(404).send() : res.status(200).send({ "status": true, "message": "Horaire de travail modifié" });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete('/horairestravail/:_id', async (req, res) => {
    try {
        const _id = req.params._id;
        const horairetravail = await horairetravailModel.findByIdAndDelete(_id);
        return !horairetravail ? res.status(404).send() : res.status(200).send({ "status": true, "message": "Horaire de travail supprimé" });
    } catch (error) {
        res.status(500).send(error);
    }
});
/*----------Gestion-des-horaires-de-travail----------*/


/*----------Gestion-des-services----------*/
router.post('/service', async (req, res) => {
    const service = new serviceModel(req.body);
    try {
        await service.save();
        res.status(201).send({
            "status": true,
            "message": "Service ajouté"
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/services', async (req, res) => {
    try {
        const services = await serviceModel.find({});
        res.status(200).send(services);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/services/:_id', async (req, res) => {
    try {
        const _id = req.params._id;
        const service = await serviceModel.findById(_id);
        return !service ? res.status(404).send() : res.status(200).send(service);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.put('/services/:_id', async (req, res) => {
    try {
        const _id = req.params._id;
        const body = req.body;
        const service = await serviceModel.findByIdAndUpdate(_id, body, { new: true });
        return !service ? res.status(404).send() : res.status(200).send({ "status": true, "message": "Service modifié" });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete('/services/:_id', async (req, res) => {
    try {
        const _id = req.params._id;
        const service = await serviceModel.findByIdAndDelete(_id);
        return !service ? res.status(404).send() : res.status(200).send({ "status": true, "message": "Service supprimé" });
    } catch (error) {
        res.status(500).send(error);
    }
});
/*----------Gestion-des-services----------*/


/*----------Prise-de-rendez-vous----------*/
router.post('/reservation', async (req, res) => {
    const services = req.body.services;
    const dateRdv = new Date(req.body.dateHeure);
    const jourSemaine = dateRdv.getDay();
    try {
        /*----------Vérification-de-la-réservation----------*/
        for (const service of services) {
            const heureRdvDebut = dateRdv.getHours() + (dateRdv.getMinutes() / 60);
            const heureRdvFin = heureRdvDebut + (service.duree / 60);
            const employe = await utilisateurModel.findById(service.employe_id).populate('horairestravail');
            const horaireEmploye = employe.horairestravail.find(horairetravail => horairetravail.jourSemaine === jourSemaine); // Horaire de travail de l'employé pour ce jour de la semaine
            if (horaireEmploye) {
                /*----------Contrainte-horaire-de-travail----------*/
                if (heureRdvDebut < horaireEmploye.heureDebut || heureRdvDebut > horaireEmploye.heureFin || heureRdvFin > horaireEmploye.heureFin) {
                    return res.status(200).send({
                        "status": false,
                        "service": service.nom,
                        "message": employe.prenom + " ne sera pas disponible à cette heure"
                    });
                }
                /*----------Contrainte-rendez-vous-existants----------*/
                const desiredDate = new Date(req.body.dateHeure.split('T')[0]);
                desiredDate.setHours(0, 0, 0, 0);
                const nextDay = new Date(desiredDate);
                nextDay.setDate(nextDay.getDate() + 1);
                nextDay.setHours(0, 0, 0, 0);
                const rendezvousEmploye = await rendezvousModel.find({
                    "employe": employe._id,
                    "date": {
                        $gte: desiredDate, // Greater than or equal to the desired date (midnight)
                        $lt: nextDay // Less than the next day (midnight)
                    }
                }).populate('service');
                for (const rendezvous of rendezvousEmploye) {
                    const date = moment.utc(rendezvous.date).local().toDate();
                    const heureDebut = date.getHours() + (date.getMinutes() / 60);
                    const heureFin = heureDebut + (rendezvous.service.duree / 60);
                    if (heureRdvDebut < heureFin && heureRdvFin > heureDebut) {
                        return res.status(200).send({
                            "status": false,
                            "service": service.nom,
                            "message": employe.prenom + " ne sera pas disponible à cette heure"
                        });
                    }
                }
                dateRdv.setMinutes(dateRdv.getMinutes() + service.duree);
            } else {
                return res.status(200).send({
                    "status": false,
                    "service": service.nom,
                    "message": employe.prenom + " ne sera pas disponible à cette date"
                });
            }
        }
        return res.status(200).send({
            "status": true,
            "message": "Vérification terminée"
        });
    } catch (error) {
        res.status(500).send(error);
    }
});
/*----------Prise-de-rendez-vous----------*/


/*----------Paiement-en-ligne----------*/
router.post('/paiement', async (req, res) => {
    const client = req.body.client;
    const services = req.body.services;
    const dateDebut = new Date(req.body.dateHeure);
    try {
        /*----------Création-des-rendez-vous----------*/
        for (const service of services) {
            const body = {
                date: dateDebut,
                client: client,
                service: service._id,
                employe: service.employe_id
            };
            const rendezvous = new rendezvousModel(body);
            await rendezvous.save();
            dateDebut.setMinutes(dateDebut.getMinutes() + service.duree);
        }
        return res.status(201).send({
            "status": true,
            "message": "Rendez-vous ajouté"
        });
    } catch (error) {
        res.status(500).send(error);
    }
});
/*----------Paiement-en-ligne----------*/

module.exports = router;