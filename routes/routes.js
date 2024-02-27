const express = require("express");
const router = express.Router();
const moment = require('moment');
var utilisateurModel = require('../src/model/utilisateur');
var serviceModel = require('../src/model/service');
var horairetravailModel = require('../src/model/horairetravail');
var rendezvousModel = require('../src/model/rendezVous');
const nodemailer = require('nodemailer');

/*----------Login de l'utilisateur----------*/
router.post('/login', async (req, res) => {
    const { email, motDePasse } = req.body;
    console.log(req.body);
    try {
        const utilisateur = await utilisateurModel.findOne({ email, motDePasse }).populate('horairestravail');
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
    //   image: image
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

module.exports = router;