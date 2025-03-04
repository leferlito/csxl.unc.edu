/**
 * Office hours queue for instructors.
 *
 * @author Ajay Gandecha <agandecha@unc.edu>
 * @copyright 2024
 * @license MIT
 */

import {
  Component,
  OnDestroy,
  OnInit,
  WritableSignal,
  signal
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import {
  OfficeHourQueueOverview,
  OfficeHourQueueOverviewJson,
  OfficeHourTicketOverview,
  parseOfficeHourQueueOverview,
  QueueWebSocketAction,
  QueueWebSocketData
} from 'src/app/my-courses/my-courses.model';
import { MyCoursesService } from 'src/app/my-courses/my-courses.service';
import { officeHourPageGuard } from '../office-hours.guard';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Component({
  selector: 'app-office-hours-queue',
  templateUrl: './office-hours-queue.component.html',
  styleUrl: './office-hours-queue.component.css'
})
export class OfficeHoursQueueComponent implements OnInit, OnDestroy {
  /** Route information to be used in the routing module */
  public static Route = {
    path: 'office-hours/:event_id/queue',
    title: 'Office Hours Queue',
    component: OfficeHoursQueueComponent,
    canActivate: [officeHourPageGuard(['UTA', 'GTA', 'Instructor'])]
  };

  /** Office hour event ID to load the queue for */
  ohEventId: number;

  /** Encapsulated signal to store the queue data */
  queue: WritableSignal<OfficeHourQueueOverview | undefined> =
    signal(undefined);

  /** Stores subscription to the timer observable that refreshes data every 10s */
  timer!: Subscription;

  /** Connection to the office hours get help websocket */
  webSocketSubject$: WebSocketSubject<any>;

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    protected myCoursesService: MyCoursesService
  ) {
    // Load information from the parent route
    this.ohEventId = this.route.snapshot.params['event_id'];
    // Load the web socket
    this.webSocketSubject$ = webSocket({
      url: `wss://${window.location.host}/ws/office-hours/${this.ohEventId}/queue?token=${localStorage.getItem('bearerToken')}`
    });
  }

  ngOnInit(): void {
    this.webSocketSubject$.subscribe((value) => {
      const json: OfficeHourQueueOverviewJson = JSON.parse(value);
      const overview = parseOfficeHourQueueOverview(json);
      this.queue.set(overview);
    });
  }

  ngOnDestroy(): void {
    this.webSocketSubject$.complete();
  }

  /** Create a timer subscription to poll office hour queue data at an interval at view initalization */
  // ngOnInit(): void {
  //   this.timer = timer(0, 10000).subscribe(() => {
  //     this.pollQueue();
  //   });
  // }

  /** Remove the timer subscription when the view is destroyed so polling does not persist on other pages */
  // ngOnDestroy(): void {
  //   this.timer.unsubscribe();
  // }

  /** Loads office hours queue data */
  // pollQueue(): void {
  //   this.myCoursesService
  //     .getOfficeHoursQueue(this.ohEventId)
  //     .subscribe((queue) => {
  //       this.queue.set(queue);
  //     });
  // }

  /** Calls a ticket and reloads the queue data */
  callTicket(ticket: OfficeHourTicketOverview): void {
    // Create the web socket object
    const action: QueueWebSocketData = {
      action: QueueWebSocketAction.CALL,
      id: ticket.id
    };
    this.webSocketSubject$.next(action);

    // this.myCoursesService.callTicket(ticket.id).subscribe({
    //   next: (_) => this.pollQueue(),
    //   error: (err) => this.snackBar.open(err, '', { duration: 2000 })
    // });
  }

  /** Cancels a ticket and reloads the queue data */
  cancelTicket(ticket: OfficeHourTicketOverview): void {
    // Create the web socket object
    const action: QueueWebSocketData = {
      action: QueueWebSocketAction.CANCEL,
      id: ticket.id
    };
    this.webSocketSubject$.next(action);

    // this.myCoursesService.cancelTicket(ticket.id).subscribe({
    //   next: (_) => this.pollQueue(),
    //   error: (err) => this.snackBar.open(err, '', { duration: 2000 })
    // });
  }

  /** Closes a ticket and reloads the queue data */
  closeTicket(ticket: OfficeHourTicketOverview): void {
    // Create the web socket object
    const action: QueueWebSocketData = {
      action: QueueWebSocketAction.CLOSE,
      id: ticket.id
    };
    this.webSocketSubject$.next(action);

    // this.myCoursesService.closeTicket(ticket.id).subscribe({
    //   next: (_) => this.pollQueue(),
    //   error: (err) => this.snackBar.open(err, '', { duration: 2000 })
    // });
  }
}
