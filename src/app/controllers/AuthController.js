import jwt from 'jsonwebtoken';
import * as Yup from 'yup';

import User from '../models/User';

import authConfig from '../../config/auth';

class AuthController {
  async store(req, res) {
    const shcema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .min(6)
        .required(),
    });

    if (!(await shcema.isValid(req.body))) {
      return res.status(422).json({ error: 'Validation fails' });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!(await user.isPasswordCorrect(password))) {
      return res.status(422).json({ error: 'Passord does not match' });
    }

    const { id } = user;

    return res.json({
      user: user.resource(),
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn,
      }),
    });
  }
}

export default new AuthController();
