import * as Yup from 'yup';
import { Op } from 'sequelize';
import {
  isBefore,
  startOfHour,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const where = {};
    const { page = 1, limit = 10 } = req.query;

    if (req.query.date) {
      const searchDate = parseISO(req.query.date);

      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'name', 'path'],
        },
      ],
      limit,
      offset: limit * page - limit,
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
    });

    try {
      await schema.validate(req.body);
    } catch ({ message, errors }) {
      return res.status(422).send({ message, errors });
    }

    const { date, file_id: fileId } = req.body;

    const startHour = startOfHour(parseISO(date));

    if (isBefore(startHour, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const fileExists = await File.findByPk(fileId);

    if (!fileExists) {
      return res.status(400).json({ error: 'Banner does not exists' });
    }

    const meetup = await Meetup.create({ ...req.body, user_id: req.userId });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      file_id: Yup.number(),
    });

    try {
      await schema.validate(req.body);
    } catch ({ message, errors }) {
      return res.status(422).send({ message, errors });
    }

    const { id } = req.params;

    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      return res.status(404).json({ error: 'Meetup not found' });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(400).json({
        error: 'You cannot update a meetup that belongs to another user',
      });
    }

    if (meetup.isPast) {
      return res.status(400).json({
        error: 'You cannot update a meetup that already happened',
      });
    }

    const { file_id: fileId } = req.body;

    if (fileId) {
      const fileExists = await File.findByPk(fileId);

      if (!fileExists) {
        return res.status(400).json({ error: 'Banner does not exists' });
      }
    }

    await meetup.update(req.body);

    await meetup.reload({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: File,
          as: 'banner',
          attributes: ['id', 'name', 'path'],
        },
      ],
    });

    return res.json(meetup);
  }

  async delete(req, res) {
    const { id } = req.params;

    const meetup = await Meetup.findByPk(id);

    if (!meetup) {
      return res.status(404).json({ error: 'Meetup not found' });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(400).json({
        error: 'You cannot cancel a meetup that belongs to another user',
      });
    }

    if (meetup.isPast) {
      return res
        .status(400)
        .json({ error: 'You cannot cancel a meetup that already happened' });
    }

    await meetup.destroy();

    return res.json({ success: true });
  }
}

export default new MeetupController();
