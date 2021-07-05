import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { MIDIService } from './services/midi.service';
import { NoteDisplayComponent } from './components/note-display/note-display.component';

@NgModule({
  declarations: [
    AppComponent,
    NoteDisplayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule
  ],
  providers: [MIDIService],
  bootstrap: [AppComponent]
})
export class AppModule { }
