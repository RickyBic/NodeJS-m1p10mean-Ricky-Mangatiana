const express = require("express");
const router = express.Router();
const moment = require('moment');
var utilisateurModel = require('../src/model/utilisateur');
var serviceModel = require('../src/model/service');
var horairetravailModel = require('../src/model/horairetravail');
var rendezvousModel = require('../src/model/rendezVous');
var depenseModel = require('../src/model/depense');

/*----------Login de l'utilisateur----------*/
router.post('/login', async (req, res) => {
    const { email, motDePasse } = req.body;
    console.log(req.body);
    try {
        const utilisateur = await utilisateurModel.findOne({ email, motDePasse })
            .populate('preferences.servicePrefere')
            .populate('preferences.employePrefere')
            .populate('horairestravail')
            .populate('services');
        if (!utilisateur) {
            return res.status(401).send({ message: 'Email ou mot de passe incorrect' });
        }
        return res.status(200).send(utilisateur);
    } catch (error) {
        res.status(500).send(error);
    }
});


/*----------Inscription d'un client----------*/
router.post('/nouveauClient', async (req, res) => {
    if (!req.body.profil) {
        req.body.profil = 2;
    }
    const utilisateur = new utilisateurModel(req.body);
    try {
        await utilisateur.save();
        res.status(201).send({
            "status": true,
            "message": "Client ajouté",
            utilisateur
        });
    } catch (error) {
        res.status(500).send(error);
    }
});


/*----------Gestion du personnel----------*/
router.post('/nouveauEmploye', async (req, res) => {
    if (!req.body.profil) {
        req.body.profil = 1;
    }
    const utilisateur = new utilisateurModel(req.body);
    try {
        await utilisateur.save();
        res.status(201).send({
            "status": true,
            "message": "Employe ajouté",
            utilisateur
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/listeEmploye', async (req, res) => {
    try {
        const utilisateurs = await utilisateurModel.find({ profil: 1 });
        res.status(200).send(utilisateurs);
    } catch (error) {
        res.status(500).send(error);
    }
});


/*----------Gestion-des-services [BASE]----------*/
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
/*----------Gestion-des-services [BASE]----------*/


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


/*----------Liste des rendez-vous----------*/
router.get('/rendezvous', async (req, res) => {
    try {
        const rendezvousList = await rendezvousModel.find();
        res.status(200).send(rendezvousList);
    } catch (error) {
        res.status(500).send(error);
    }
});

//rdv par employe
router.get('/rendezvous/employe/:employeId', async (req, res) => {
    try {
        const rendezvousListparEmploye = await rendezvousModel.find({ employe: req.params.employeId })
            .populate('client')
            .populate('service')
            .exec();
        res.status(200).json(rendezvousListparEmploye);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/rendezvous/client/:clientId', async (req, res) => {
    try {
        const rendezvousListparClient = await rendezvousModel.find({ client: req.params.clientId })
            .populate('employe')
            .populate('service')
            .exec();
        res.status(200).json(rendezvousListparClient);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/*Horaire de travail*/
router.put('/utilisateur/:userId/horairetravail/:horaireId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const horaireId = req.params.horaireId;
        const nouvelHoraire = req.body; // Données de l'horaire de travail à mettre à jour

        // Vérifiez si l'utilisateur existe
        const utilisateur = await utilisateurModel.findById(userId);
        if (!utilisateur) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Vérifiez si l'horaire de travail existe
        const horaireTravail = await horaireTravailModel.findById(horaireId);
        if (!horaireTravail) {
            return res.status(404).json({ message: "Horaire de travail non trouvé" });
        }

        // Effectuez la mise à jour de l'horaire de travail
        await horaireTravailModel.findByIdAndUpdate(horaireId, nouvelHoraire);

        res.status(200).json({ message: "Horaire de travail mis à jour avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


/*----------Tâches-effectuées-et-montant-de-commission-pour-la-journée----------*/
router.get('/taches/:employeId', async (req, res) => {
    try {
        const desiredDate = new Date();
        desiredDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(desiredDate);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        const taches = await rendezvousModel.find({ // [rendezvous] Tâches effectuées par l'employé 
            "employe": req.params.employeId,
            "date": {
                $gte: desiredDate,
                $lt: nextDay
            },
            "etat": 1
        }).populate('service').populate('client');
        let commission = 0;
        let pourcentage = 0;
        for (const tache of taches) {
            commission += tache.service.prix * tache.service.commission;
            pourcentage += tache.service.commission;
        }
        res.status(200).send({
            "status": true,
            "taches": taches,
            "commission": commission,
            "pourcentage": pourcentage
        });
    } catch (error) {
        res.status(500).send(error);
    }
});
/*----------Tâches-effectuées-et-montant-de-commission-pour-la-journée----------*/


/*----------Gestion-des-préférences----------*/
router.put('/preferences/:clientId', async (req, res) => {
    try {
        const clientId = req.params.clientId;
        const body = req.body;
        const service = await utilisateurModel.findByIdAndUpdate(clientId, body, { new: true });
        return !service ? res.status(404).send() : res.status(200).send({ "status": true, "message": "Préférences modifiées" });
    } catch (error) {
        res.status(500).send(error);
    }
});
/*----------Gestion-des-préférences----------*/


/*----------Statistiques----------*/
router.post('/statistiques', async (req, res) => {
    try {
        const dateDebut = new Date(req.body.dateDebut);
        const dateFin = new Date(req.body.dateFin);
        const rendezvous = await rendezvousModel.find({ date: { $gte: dateDebut, $lte: dateFin } }).populate('service');
        const nombreDeJours = (dateFin - dateDebut) / (1000 * 60 * 60 * 24); // Calculer le nombre de jours dans la période
        /*----------Temps-moyen-de-travail-pour-chaque-employé----------*/
        const tempsMoyenDeTravail = [];
        const employes = await utilisateurModel.find({ profil: 1 });
        for (const employe of employes) {
            let total = 0; // minutes
            const rendezvous = await rendezvousModel.find({ date: { $gte: dateDebut, $lte: dateFin }, employe: employe._id }).populate('service');
            for (const rdv of rendezvous) {
                total += rdv.service.duree;
            }
            tempsMoyenDeTravail.push(
                {
                    "employe": employe,
                    "moyenne": rendezvous.length > 0 ? total / rendezvous.length : 0,
                }
            );
        }
        /*----------Chiffre-d’affaires----------*/
        let chiffreAffairesTotal = 0;
        let commissionTotal = 0;
        for (const rdv of rendezvous) {
            chiffreAffairesTotal += rdv.service.prix;
            commissionTotal += rdv.service.prix * rdv.service.commission;
        }
        let nombreDeMois = 0;
        const chiffreAffairesParMois = {}; // Initialiser un objet pour stocker le chiffre d'affaires par mois [Pas nécessaire]
        for (const rdv of rendezvous) {
            const moisRdv = rdv.date.getMonth() + 1; // Les mois sont indexés à partir de 0, donc nous ajoutons 1
            if (!chiffreAffairesParMois[moisRdv]) {
                chiffreAffairesParMois[moisRdv] = 0;
                nombreDeMois++; // [Nécessaire]
            }
            chiffreAffairesParMois[moisRdv] += rdv.service.prix; // Ajouter le chiffre d'affaires du service au mois correspondant
        }
        const chiffreAffaireJournalier = chiffreAffairesTotal / nombreDeJours; // Calculer le chiffre d'affaires moyen par jour
        const chiffreAffaireMensuel = chiffreAffairesTotal / nombreDeMois; // Calculer le chiffre d'affaires moyen par mois
        /*----------Le-nombre-de-réservation-----------*/
        const nombreDeReservationJournalier = rendezvous.length / nombreDeJours; // Calculer le nombre de réservation moyen par jour
        const nombreDeReservationMensuel = rendezvous.length / nombreDeMois; // Calculer le nombre de réservation moyen par mois
        /*----------Bénéfice-par-mois----------*/
        let depensesTotal = 0;
        const depenses = await depenseModel.find({});
        for (const depense of depenses) {
            depensesTotal += depense.montant;
        }
        const beneficeMensuel = chiffreAffaireMensuel - (commissionTotal / nombreDeMois) - depensesTotal;
        /*----------Envoi-des-données----------*/
        res.status(200).send({
            "status": true,
            "tempsMoyenDeTravail": tempsMoyenDeTravail,
            "nombreDeReservationJournalier": nombreDeReservationJournalier,
            "nombreDeReservationMensuel": nombreDeReservationMensuel,
            "chiffreAffaireJournalier": chiffreAffaireJournalier,
            "chiffreAffaireMensuel": chiffreAffaireMensuel,
            "beneficeMensuel": beneficeMensuel
        });
    } catch (error) {
        res.status(500).send(error);
    }
});
/*----------Statistiques----------*/


/*----------Gestion-des-dépenses----------*/
router.post('/depense', async (req, res) => {
    const depense = new depenseModel(req.body);
    try {
        await depense.save();
        res.status(201).send({
            "status": true,
            "message": "Dépense ajouté"
        });
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/depenses', async (req, res) => {
    try {
        const depenses = await depenseModel.find({});
        res.status(200).send(depenses);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.delete('/depense/:_id', async (req, res) => {
    try {
        const _id = req.params._id;
        const depense = await depenseModel.findByIdAndDelete(_id);
        return !depense ? res.status(404).send() : res.status(200).send({ "status": true, "message": "Dépense supprimé" });
    } catch (error) {
        res.status(500).send(error);
    }
});
/*----------Gestion-des-dépenses----------*/

module.exports = router;