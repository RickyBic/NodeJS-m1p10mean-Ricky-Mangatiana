const express = require("express");
const router = express.Router();
const moment = require('moment');
var utilisateurModel = require('../src/model/utilisateur');
var serviceModel = require('../src/model/service');
var horairetravailModel = require('../src/model/horairetravail');
var rendezvousModel = require('../src/model/rendezVous');
var depenseModel = require('../src/model/depense');
const nodemailer = require('nodemailer');

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
    const horairesTravailParDefaut = [
        '65cf115cb17132c3f3e38698',
        '65cf1161b17132c3f3e3869a',
        '65cf1166b17132c3f3e3869c',
        '65cf116ab17132c3f3e3869e',
        '65cf116eb17132c3f3e386a0',
        '65cf117db17132c3f3e386a2'
    ];
    try {
        const utilisateur = new utilisateurModel(req.body);
        utilisateur.horairestravail = horairesTravailParDefaut;
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

router.put('/modifyEmploye/:id', async (req, res) => {
    const { id } = req.params;
    const { nom, prenom, email, motDePasse, services } = req.body;
    try {
        const utilisateur = await utilisateurModel.findById(id);
        if (!utilisateur) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        if (nom) {
            utilisateur.nom = nom;
        }
        if (prenom) {
            utilisateur.prenom = prenom;
        }
        if (email) {
            utilisateur.email = email;
        }
        if (motDePasse) {
            utilisateur.motDePasse = motDePasse;
        }
        if (services) {
            utilisateur.services = services;
        }
        await utilisateur.save();
        return res.status(200).json({ utilisateur });
    } catch (error) {
        console.error("Erreur lors de la modification de l'utilisateur :", error);
        return res.status(500).json({ message: "Erreur serveur lors de la modification de l'utilisateur" });
    }
});
/*----------Gestion-du-personnel----------*/

/*----------Gestion-des-services [BASE]----------*/
router.post('/service', async (req, res) => {
    const { nom, prix, duree, commission, image } = req.body;
    const service = new serviceModel({
        nom,
        prix,
        duree,
        commission,
        // image: image
        image: Buffer.from(image, 'base64')
    });
    try {
        await service.save();
        res.status(201).send({
            "status": true,
            "message": "Service ajouté",
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
        const rendezvousList = await rendezvousModel.find()
            .populate('client')
            .populate('service')
            .populate('employe')
            .exec();
        res.status(200).send(rendezvousList);
    } catch (error) {
        res.status(500).send(error);
    }
});

//rdv par employe
router.get('/rendezvous/employe/:employeId', async (req, res) => {
    try {
        const rendezvousListparEmploye = await rendezvousModel.find({ 
            employe: req.params.employeId,
            etat: 0
        })
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

router.put('/effectuerendezvous/:id', async (req, res) => {
    const rendezvousId = req.params.id;
    try {
        const rendezvous = await rendezvousModel.findByIdAndUpdate(rendezvousId, { etat: 1 }, { new: true });
        if (!rendezvous) {
            return res.status(404).json({ message: "Rendez-vous non trouvé" });
        }
        return res.status(200).json({ message: "État du rendez-vous mis à jour avec succès", rendezvous });
    } catch (error) {
        return res.status(500).json({ message: "Erreur lors de la mise à jour de l'état du rendez-vous", error: error.message });
    }
});

//Send Mail
// Configurer le transporteur (SMTP)
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: '@gmail.com', //mailenvoyeur
        pass: 'kklf ybyr fptc ivna' //motdepasse genere depuis identifiant à deux facteurs dans gmail
    },
    tls: {
        rejectUnauthorized: false // Ignorer les erreurs de certificat
    }
});

router.post('/envoyer-email', (req, res) => {
    const { destinataire, sujet, contenu } = req.body;
    let mailOptions = {
        from: '@gmail.com', //mailenvoyeur
        to: destinataire,
        subject: sujet,
        text: contenu
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Erreur lors de l\'envoi du courriel:', error);
            res.status(500).json({ message: 'Erreur lors de l\'envoi du courriel' });
        } else {
            console.log('Courriel envoyé avec succès:', info.response);
            res.json({ message: 'Courriel envoyé avec succès' });
        }
    });
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

/*modifier horaire de travail*/
router.get('/horaires-travail/:jourSemaine', async (req, res) => {
    const jourSemaine = req.params.jourSemaine;
    try {
        const horairesTravail = await horairetravailModel.find({ jourSemaine });
        res.status(200).json(horairesTravail);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/utilisateur/:utilisateurId/horairetravail', async (req, res) => {
    const utilisateurId = req.params.utilisateurId;
    const horaireAchanger = req.body;
    try {
        await utilisateurModel.findByIdAndUpdate(utilisateurId, { $pull: { horairestravail: horaireAchanger._id } });
        res.status(200).json({ message: "Horaire de travail supprimé avec succès." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/utilisateur/:utilisateurId/horairetravail', async (req, res) => {
    const utilisateurId = req.params.utilisateurId;
    const horaireTravailDetails = req.body;
    try {
        const utilisateur = await utilisateurModel.findById(utilisateurId);
        utilisateur.horairestravail.push(horaireTravailDetails);
        await utilisateur.save();
        console.log(horaireTravailDetails);
        res.status(201).json({ message: "HoraireTravail ajouté à la liste de l'utilisateur." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;