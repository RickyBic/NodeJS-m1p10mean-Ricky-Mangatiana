const express = require("express");
const router = express.Router();
var utilisateurModel = require('../src/model/utilisateur');
var serviceModel = require('../src/model/service');

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
/*----------Gestion du personnel----------*/

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

module.exports = router;