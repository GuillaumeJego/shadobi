import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DonneesService, Prestation } from '../donnees.service';

@Component({
  selector: 'app-prestations',
  imports: [RouterLink],
  templateUrl: './prestations.html',
  styleUrl: './prestations.scss'
})
export class Prestations implements OnInit {

  private donnees = inject(DonneesService);

  prestations = signal<Prestation[]>([]);

  ngOnInit(): void {
    this.donnees.prestations().then(p => this.prestations.set(p)).catch(console.error);
  }

}
