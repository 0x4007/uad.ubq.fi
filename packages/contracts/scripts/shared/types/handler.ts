import { Env } from "./env"

export type DeployFuncParam = {
    env: Env
    args: unknown
};

export type DeployFuncCallback = (params: DeployFuncParam) => Promise<unknown>;

export type TaskFuncParam = {
    env: Env
    args: unknown
}

export type TaskFuncCallBack = (params: TaskFuncParam) => Promise<unknown>;