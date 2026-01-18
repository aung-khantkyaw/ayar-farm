import { Router } from "express";
import { MachineController } from "../controllers/machine";
import { authenticate, isAdmin } from "../middlewares";
import { uploadImage } from "../middlewares/upload";

const machine = Router();
const machineController = new MachineController();

machine.get("/", (_req, res) => res.json({ ok: true, message: "Machine API is running" }));
machine.get("/machinetypes", (req, res) => machineController.getMachineTypes(req, res));
machine.get("/machinetypes/:id", (req, res) => machineController.getMachineTypes(req, res));
machine.get("/machines", (req, res) => machineController.getMachines(req, res));
machine.get("/machines/:id", (req, res) => machineController.getMachines(req, res));

machine.post('/machinetypes', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => machineController.addMachineType(req, res));
machine.post('/machines', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => machineController.addMachine(req, res));  

machine.put('/machinetypes/:id', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => machineController.editMachineType(req, res));
machine.put('/machines/:id', authenticate, isAdmin, uploadImage.array('image_urls'), (req, res) => machineController.editMachine(req, res));  

machine.delete('/croptypes', authenticate, isAdmin, (req, res) => machineController.bulkDeleteMachineTypes(req, res));
machine.delete('/crops', authenticate, isAdmin, (req, res) => machineController.bulkDeleteMachines(req, res));

machine.delete('/machinetypes/:id', authenticate, isAdmin, (req, res) => machineController.deleteMachineType(req, res));
machine.delete('/machines/:id', authenticate, isAdmin, (req, res) => machineController.deleteMachine(req, res));

export default machine;