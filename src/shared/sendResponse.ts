import { Response } from 'express';

interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
  meta?: IApiResponse<T>['meta']
) => {
  const response: IApiResponse<T> = {
    success,
    message,
    ...(data && { data }),
    ...(meta && { meta }),
  };

  res.status(statusCode).json(response);
};

export default sendResponse;