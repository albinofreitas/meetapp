import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class OrganizerController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
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

    return res.json(meetups);
  }
}

export default new OrganizerController();
