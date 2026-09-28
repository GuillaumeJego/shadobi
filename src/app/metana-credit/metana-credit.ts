import { Component } from '@angular/core';

// Mention « Codéveloppé par MetanaFr », en bas à droite de chaque page.
@Component({
  selector: 'app-metana-credit',
  template: `
    <div class="metana-credit">
      <img src="assets/images/metana.png" alt="" class="metana-logo" width="24" height="24">
      <span>Codéveloppé par <strong>MetanaFr</strong></span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      background: #29241f;
    }

    .metana-credit {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 10px 25px 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-family: 'Blinker', sans-serif;
    }

    .metana-logo {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    span {
      font-size: 12px;
      color: #aaa29a;
    }

    strong {
      color: #e6ded5;
    }
  `
})
export class MetanaCredit {

}
