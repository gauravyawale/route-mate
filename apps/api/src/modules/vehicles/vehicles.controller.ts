import { FastifyReply, FastifyRequest } from "fastify";
import { vehiclesService } from "./vehicles.service";
import { AddVehicleInput } from "@route-mate/shared";

export class VehicleController {
  async getMyVehicles(req: FastifyRequest, reply: FastifyReply) {
    const result = await vehiclesService.getMyVehicles(req.user.id);
    return reply.code(200).send({ data: result });
  }

  async addVehicle(req: FastifyRequest, reply: FastifyReply) {
    const body = req.body as AddVehicleInput;
    const result = await vehiclesService.addVehicle(req.user.id, body);
    return reply.code(201).send({ data: result });
  }

  async setVehicleActive(req: FastifyRequest, reply: FastifyReply) {
    const { id: vehicleId } = req.params as { id: string };
    const { is_active } = req.body as { is_active: boolean };
    const result = await vehiclesService.setVehicleActive(
      req.user.id,
      vehicleId,
      is_active,
    );
    return reply.code(200).send({ data: result });
  }
}

export const vehicleController = new VehicleController();
