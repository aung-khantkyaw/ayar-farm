import { Request, Response } from "express";
import { MachineService } from "../services/machine";

export class MachineController {
    public async getMachineTypes(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            const data = id ? (await MachineService.getMachineTypeById(id)).machineType
                : (await MachineService.getAllMachineTypes()).machineTypes;

            if (!data) {
                res.status(404).json({ message: 'MachineType not found' });
                return;
            }

            res.status(200).json({ message: 'Get machine type(s) successful', data });
        } catch (error) {
            res.status(500).json({ message: `Error fetching machine types: ${error}` });
            console.error("Error fetching machine types:", error);
        }
    }

    public async getMachines(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            const data = id ? (await MachineService.getMachineById(id)).machine 
                : (await MachineService.getAllMachines()).machines

            if (!data) {
                res.status(404).json({ message: 'Machines not found' });
                return;
            }

            res.status(200).json({ message: 'Get all machines successful', data });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error fetching machines: ${error}` });
            console.error("Error fetching machines:", error);
        }
    }

    public async addMachineType(req: Request, res: Response): Promise<void> {
        try {
            const { name, description } = req.body;
            const image_urls = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

            const newMachineType = (await MachineService.addNewMachineType(name, description, image_urls)).machineType;

            if (!newMachineType) {
                res.status(400).json({ message: 'Machine type added fail' })
            }

            res.status(201).json({ message: 'Machine type added successfully', data: newMachineType });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error adding machine types: ${error}`})
            console.error("Error adding machine types:", error)
        }
    }

    public async addMachine(req: Request, res: Response): Promise<void> {
        try {
            const { machine_type_id, name, description } = req.body;
            const image_urls = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : [];

            const newMachine = (await MachineService.addNewMachine(machine_type_id, name, description, image_urls)).machine;

            if (!newMachine) {
                res.status(400).json({ message: 'Machine type added fail' })
            }

            res.status(201).json({ message: 'Machine added successfully', data: newMachine });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error adding machine: ${error}`})
            console.error("Error adding machine:", error)
        }
    }

    public async editMachineType(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            const files = req.files as Express.Multer.File[];
            console.log(`Received ${files ? files.length : 0} files`);
            
            const existingMachineType = (await MachineService.getMachineTypeById(id)).machineType;

            if (!existingMachineType) {
                res.status(404).json({ message: 'Machine type not found' })
            }
            
            const newImageUrls = files ? files.map((file) => file.path) : [];
            const image_urls = [...existingMachineType!.image_urls, ...newImageUrls];
            
            const updatedMachineType = (await MachineService.updateMachineType(id, name, description, image_urls)).machineType;

            res.status(200).json({ message: 'Machine type updated successfully', data: updatedMachineType });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error editing machine types: ${error}` })
            console.error("Error editing machine types:", error)
        }
    }

    public async editMachine(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { machine_type_id, name, description } = req.body;

            const files = req.files as Express.Multer.File[];
            console.log(`Received ${files ? files.length : 0} files`);
            
            const existingMachine = (await MachineService.getMachineById(id)).machine;

            if (!existingMachine) {
                res.status(404).json({ message: 'Machine not found' })
            }
            
            const newImageUrls = files ? files.map((file) => file.path) : [];
            const image_urls = [...existingMachine!.image_urls, ...newImageUrls];
            
            const updatedMachine = (await MachineService.updateMachine(id, machine_type_id, name, description, image_urls)).machine;

            res.status(200).json({ message: 'Machine updated successfully', data: updatedMachine });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error editing machine: ${error}` })
            console.error("Error editing machine:", error)
        }
    }

    public async deleteMachineType(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const ids = Array.isArray(id) ? id : [id];

            await MachineService.deleteMachineTypes(ids);
            
            res.status(200).json({ message: 'Machine type(s) deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting machine type(s): ${error}` })
            console.error("Error deleting machine type(s):", error)
        }
    }

    public async deleteMachine(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const ids = Array.isArray(id) ? id : [id];

            await MachineService.deleteMachines(ids);
            
            res.status(200).json({ message: 'Machine(s) deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting machine(s): ${error}` })
            console.error("Error deleting machine(s):", error)
        }
    }

    public async bulkDeleteMachineTypes(req: Request, res: Response): Promise<void> {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                res.status(400).json({ message: 'Invalid ids provided' });
                return;
            }

            await MachineService.deleteMachineTypes(ids);
            
            res.status(200).json({ message: 'Machine types deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting Machine types: ${error}` })
            console.error("Error deleting Machine types:", error)
        }
    }

    public async bulkDeleteMachines(req: Request, res: Response): Promise<void> {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                res.status(400).json({ message: 'Invalid ids provided' });
                return;
            }

            await MachineService.deleteMachines(ids);
            
            res.status(200).json({ message: 'Machine(s)  deleted successfully' });
            return;
        } catch (error) {
            res.status(500).json({ message: `Error deleting Machine(s) : ${error}` })
            console.error("Error deleting Machine(s) :", error)
        }
    }
}