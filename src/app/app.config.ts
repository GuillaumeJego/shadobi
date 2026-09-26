import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Nouvelle page : on part du haut. Retour arrière : on retrouve sa position.
    // Un lien avec ancre (ex. /#prestations) descend jusqu'à la section.
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
    }))
  ]
};
