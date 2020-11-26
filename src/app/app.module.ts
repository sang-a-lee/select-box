import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DualSelectorComponent } from './dual-selector/dual-selector.component';

@NgModule({
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
  declarations: [AppComponent, DualSelectorComponent],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
