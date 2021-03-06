require ('dotenv').config();
require('../../lib/utils/connect')();
const mongoose = require('mongoose');
const { Types } = require('mongoose');
const User = require('../../lib/models/User');
const { tokenize, untokenize } = require('../../lib/utils/token');

describe('User model', () => {
  beforeEach(done => {
    mongoose.connection.dropDatabase(done);
  });
  
  afterAll(done => {
    mongoose.connection.close(done);
  });

  it('validates a good model', () => {
    const user = new User({ email: 'test@test.com' });
    expect(user.toJSON()).toEqual({ email: 'test@test.com', _id: expect.any(Types.ObjectId) });
  });

  it('has a required email', () => {
    const user = new User({});
    const errors = user.validateSync().errors;
    expect(errors.email.message).toEqual('Email required');

  });

  it('stores a _tempPassword', () => {
    const user = new User({ email: 'test@test.com', password: 'password' });
    expect(user._tempPassword).toEqual('password');
  });

  it('has a password hash', () => {
    // old way:
    // const user = new User({ email: 'test@test.com', password: 'password' });
    // user.save();
    // new way:
    return User.create({
      email: 'test@test.com',
      password: 'password'
    })
      .then(user => {
        expect(user.passwordHash).toEqual(expect.any(String));
        expect(user.password).toBeUndefined();
      });
  });

  it('can compare good passwords', () => {
    return User.create({
      email: 'test@test.com',
      password: 'password'
    })
      .then(user => {
        return user.compare('password');
      })
      .then(result => {
        expect(result).toBeTruthy();
      });
  });

  it('can compare bad passwords', () => {
    return User.create({
      email: 'test@test.com',
      password: 'password'
    })
      .then(user => {
        return user.compare('badPassword');
      })
      .then(result => {
        expect(result).toBeFalsy();
      });
  });

  it('can find a user by token', () => {
    return User.create({
      email: 'test@test.com',
      password: 'password'
    })
      .then(user => {
        const token = tokenize(user);
        return User.findByToken(token);
      })
      .then(userFromToken => {
        expect(userFromToken).toEqual({
          email: 'test@test.com',
          _id: expect.any(String),
        });
      });
  });

  it('can create an auth token', () => {
    return User.create({
      email: 'test@test.com',
      password: 'password'
    })
      .then(user => user.authToken())
      .then(untokenize)
      .then(user => {
        expect(user).toEqual({
          email: 'test@test.com',
          _id: expect.any(String)
        });
      });
  });

});
