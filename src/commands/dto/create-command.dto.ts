import { IsEnum, IsObject, IsString, IsUUID } from 'class-validator';

export enum CommandType {
  START_SERVER = 'START_SERVER',
  STOP_SERVER = 'STOP_SERVER',
  RESTART_SERVER = 'RESTART_SERVER',
  UPDATE_AGENT = 'UPDATE_AGENT',
  LIST_FILES = 'LIST_FILES',
  GET_FILE = 'GET_FILE',
  WRITE_FILE = 'WRITE_FILE',
  DELETE_FILE = 'DELETE_FILE',
  EXEC_COMMAND = 'EXEC_COMMAND', // For sending commands to game console
  GET_LOGS = 'GET_LOGS',
  INSTALL_MODPACK = 'INSTALL_MODPACK',
  WAKE_SERVER = 'WAKE_SERVER',
}

export class CreateCommandDto {
  @IsUUID()
  targetNodeId!: string;

  @IsEnum(CommandType)
  type!: CommandType;

  @IsObject()
  payload!: any; // Dynamic payload based on command type
}

export class AgentCommandResponse {
  id!: string;
  type!: CommandType;
  payload!: any;
  createdAt!: Date;
}
