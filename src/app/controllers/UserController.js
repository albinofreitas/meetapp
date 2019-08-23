import * as Yup from 'yup';

import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      name: Yup.string().required(),
      password: Yup.string()
        .min(6)
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(422).json({ error: 'Validation fails' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists) {
      return res.status(422).json({ error: 'User already exists' });
    }

    const user = await User.create(req.body);

    return res.json({ user: user.resource() });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      password: Yup.string()
        .min(6)
        .oneOf([Yup.ref('confirmPassword')]),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')])
        .when('password', (password, field) => {
          return password ? field.required() : field;
        }),
      oldPassword: Yup.string()
        .min(6)
        .when('password', (password, field) =>
          password ? field.required() : field
        ),
    });

    try {
      await schema.validate(req.body);
    } catch ({ message, errors }) {
      return res.status(422).send({ message, errors });
    }

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { email, oldPassword } = req.body;

    if (email && user.email !== email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists) {
        return res.status(422).json({ error: 'User already exists' });
      }
    }

    if (oldPassword && !(await user.isPasswordCorrect(oldPassword))) {
      return res.status(422).json({ error: 'Passowrd does not match' });
    }

    delete req.body.password_hash;

    const userUpdated = await user.update(req.body);

    return res.send({ user: userUpdated.resource() });
  }
}

export default new UserController();
