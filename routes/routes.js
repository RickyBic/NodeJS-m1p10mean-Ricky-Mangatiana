const express = require("express");
const router = express.Router();
var utilisateurModel = require('../src/model/utilisateur');
var serviceModel = require('../src/model/service');
var rendezvousModel = require('../src/model/rendezvous');
var horaireTravailModel = require('../src/models/horairetravail');

/*----------Gestion du personnel----------*/
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

router.get('/utilisateurs', async (req, res) => {
    try {
        const utilisateurs = await utilisateurModel.find();
        res.status(200).send(utilisateurs);
    } catch (error) {
        res.status(500).send(error);
    }
});

/*----------Login de l'utilisateur----------*/
router.post('/login', async (req, res) => {
    const { email, motDePasse } = req.body;
    console.log(req.body);
    try {
        const utilisateur = await utilisateurModel.findOne({ email, motDePasse });
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

/*----------Gestion des services----------*/
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
/*----------Gestion des services----------*/


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


module.exports = router;