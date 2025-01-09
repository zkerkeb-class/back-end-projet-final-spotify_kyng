const authService = require('../services/authService');

const loginController = async (req, res) => {
  console.log('LoginController invoked');
  const { email, password } = req.body;
  try {
    const token = await authService.loginUser(email, password);
    res.status(200).json({ token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/*const registerController = async (req, res) => {
  const { firstname, lastname, email, phone, password, role } = req.body;

  try {
    const user = await authService.createUser({ firstname, lastname, email, phone, password, role });
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};*/

module.exports = {
  loginController,
  //registerController,
};
