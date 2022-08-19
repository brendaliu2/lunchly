"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** find a customer by name. */

  static async getByName(name) {

    name = name.split(" ");
    let results = null;

    if (name.length === 1) {
      results = await db.query(
        `SELECT id,
          first_name AS "firstName",
          last_name  AS "lastName",
          phone,
          notes
          FROM customers
          WHERE first_name ILIKE $1 OR last_name ILIKE $1
          ORDER BY last_name, first_name`
        , [...name]);
    } else {
      results = await db.query(
        `SELECT id,
        first_name AS "firstName",
        last_name  AS "lastName",
        phone,
        notes
        FROM customers
        WHERE first_name ILIKE $1 AND last_name ILIKE $2
        ORDER BY last_name, first_name`
        , [...name]);
    }

    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /**  Get top 10 customers with most reservations*/

  static async getMostReservations(num = 10) {
    // An inefficent but exciting solution
    //
    // let results = await Reservation.getCustomersWithMostReservations();
    // let customers = results.map(async c => await Customer.get(c))
    // customers = await Promise.all(customers);

    const results = await db.query(`
      SELECT c.id, c.first_name AS "firstName", 
              c.last_name AS "lastName",
              c.phone, 
              c.notes
        FROM customers AS c
        JOIN reservations AS r
        ON c.id = r.customer_id
        GROUP BY r.customer_id, c.id, c.first_name, c.last_name, c.phone, c.notes
        ORDER BY COUNT(r.customer_id) DESC 
        LIMIT $1;`
      , [num]);

    return results.rows.map(c => new Customer(c));
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }
/**returns customer's full name */
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

module.exports = Customer;
