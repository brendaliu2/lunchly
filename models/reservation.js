"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

const { BadRequestError } = require('../expressError')

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }
  

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }
  
  /** Gets top 10 customer ids with most reservations. */
  // static async getCustomersWithMostReservations(num = 10) {
    
  //   const results = await db.query(
  //     `SELECT customer_id AS "customerId"
  //     FROM reservations
  //     GROUP BY customer_id
  //     ORDER BY COUNT(customer_id) DESC 
  //     LIMIT $1
  //     `, [num]);
  
  //   return results.rows.map(res => res.customerId)
  // }

  /** Given a reservation id, returns reservation instance */
  static async get(reservationId) {
    let results = await db.query(
      `SELECT id,
        customer_id AS "customerId",
        num_guests AS "numGuests",
        start_at AS "startAt",
        notes AS "notes"
      FROM reservations
      WHERE id = $1`,
      [reservationId],
      );
      results = results.rows.map(row => new Reservation(row));
      return results[0];
  }
/**Updates an existing reservation. Or make a new one if non-existent */
  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
             SET customer_id=$1,
             num_guests=$2,
             start_at=$3,
                 notes=$4
             WHERE id = $5`, [
        this.customerId,
        this.numGuests,
        this.startAt,
        this.notes,
        this.id,
      ],
      );
    }
  }
  
  get numGuests(){
    return this._numGuests;
  }
  
  
  /**Set numGuests */
  set numGuests(num){
    if(num <= 0){
      throw new BadRequestError('Guests cannot be negative or zero!')
    } else {
      this._numGuests = num;
    }
  }
}


module.exports = Reservation;
