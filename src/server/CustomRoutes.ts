/*
 * Copyright (c) 2021, IBM Deutschland GmbH
 */
import { Route } from './Route';

/**
 * Simple data holder for the express router.
 *
 * @export
 * @class CustomRoutes
 */
export class CustomRoutes {
    private static customRoutes: Route[] = [];

    public static addRoute(method: string, route: string): void {
        CustomRoutes.customRoutes.push(new Route(method, route));
    }

    public static getRoutes(): Route[] {
        return CustomRoutes.customRoutes;
    }
}
