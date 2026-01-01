import { prisma } from "../prisma/client";
import { deleteImage } from "../utils";

export class MachineService {
    public static async getAllMachineTypes(): Promise<{ machineTypes: any}> {
        try {
            const machineTypes = await prisma.machineTypes.findMany({
                orderBy: { created_at: 'asc' },
                include: { machines: true },
            })

            return { machineTypes };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getMachineTypeById(id: string): Promise<{ machineType: any }> {
        try {
            const machineType = await prisma.machineTypes.findUnique({
                where: { id },
                include: { machines: true },
            });

            return { machineType };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getAllMachines(): Promise<{machines: any}> {
        try {
            const machines = await prisma.machines.findMany({
                orderBy: { created_at: 'asc' },
                include: { MachineTypes: true }
            })

            return { machines };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async getMachineById(id: string): Promise<{ machine: any }> {
        try {
            const machine = await prisma.machines.findUnique({
                where: { id },
                include: { MachineTypes: true }
            });

            return { machine };
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addNewMachineType(name: string, description: string, image_urls: string[]): Promise<{ machineType: any }> {
        try {
            const machineType = await prisma.machineTypes.create({
                data: {
                    name,
                    description,
                    image_urls,
                }
            });

            return { machineType }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async addNewMachine(machine_type_id: string, name: string, description: string, image_urls: string[]): Promise<{ machine: any }> {
        try {
            const machine = await prisma.machines.create({
                data: {
                    machine_type_id,
                    name,
                    description,
                    image_urls,
                }
            });

            return { machine }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateMachineType(id: string, name: string, description: string, image_urls: string[]): Promise<{ machineType: any }> {
        try {
            const machineType = await prisma.machineTypes.update({
                where: { id },
                data: {
                    name,
                    description,
                    image_urls,
                }
            })

            return { machineType }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async updateMachine(id: string, machine_type_id: string, name: string, description: string, image_urls: string[]): Promise<{ machine: any }> {
        try {
            const machine = await prisma.machines.update({
                where: { id },
                data: {
                    machine_type_id,
                    name,
                    description,
                    image_urls,
                }
            });

            return { machine }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async deleteMachineTypes(ids: string[]): Promise<void> {
        try {
            for (const machineTypeId of ids) {
                const machineType = await prisma.machineTypes.findUnique({
                    where: { id: machineTypeId },
                });
                if (machineType) {
                    const machines = await prisma.machines.findMany({
                        where: { machine_type_id: machineType.id },
                        select: { id: true }
                    })
                    const machineIds = machines.map(machine => machine.id);
                    await this.deleteMachines(machineIds);
                    await deleteImage(machineType.image_urls);
                    await prisma.machineTypes.delete({
                        where: { id: machineTypeId },
                    });
                }
            }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }

    public static async deleteMachines(ids: string[]): Promise<void> {
        try {
            for (const machineId of ids) {
                const machine = await prisma.machines.findUnique({
                    where: { id: machineId },
                });
                if (machine) {
                    await deleteImage(machine.image_urls);
                    await prisma.machines.delete({
                        where: { id: machineId },
                    });
                }
            }
        } catch (error) {
            throw new Error(`Database query failed: ${String(error)}`);
        }
    }
}