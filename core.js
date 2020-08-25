const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const generatePassword = require('password-generator');


const NewUserItem = require('./models/User.js');
const WorkerItem = require('./models/Worker.js');
const LogItem = require('./models/Log.js');
const Report = require('./models/Report.js');
const ReportEditItem = require('./models/ReportEdit.js');
const Bonus = require('./models/Bonus.js');
const JobItem = require('./models/Jobs.js');

const app = express();
const jsonParser = express.json();

const PORT = process.env.PORT || 3001;
const JWT_KEY = JSON.stringify(Date())

async function start(){
	try{
		app.listen(PORT, () => {
			console.log('Server has been started...');
		});
		await mongoose.connect('mongodb://chatbot_melnik_user:ChAt_melnik_Pass@94.232.214.210:9017/telegram_chatbot_melnik_db', {useNewUrlParser: true, useUnifiedTopology: true})
		// await LogItem.deleteMany({})
		// DB = mongoose.connection.db
		// DB.collection("reports", function(err, collection){
		// 	collection.find({}).toArray(function(err, data){
		// 		console.log(data); // it will print your collection data
		// 	})
		// })
		console.log('Set connetion to data base');
	}catch(e){
		console.log(e)
		console.log('Not connetion!')
	}
}

start();

app.use((request, response, next) => {
	response.set('Access-Control-Allow-Origin', '*');
	response.set("Access-Control-Allow-Headers", "Content-Type");
	next()
});


app.post('/createUser', jsonParser, async (request, response) => {
	const email = request.body.email
	const password = request.body.password;
	const name = request.body.name;
	const jwtToken = request.body.jwt;
	const jwtUser = jwt.sign({email, password}, JWT_KEY)
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			let potentialUser = await NewUserItem.findOne({
				email
			})
			if(potentialUser){
				response.json({message: "Пользователь уже существует"})
			} else {
				let user = await new NewUserItem({
					name,
					email,
					password,
					jwt : jwtUser,
					auth : false
				}).save()
				await LogItem({
					owner: admin.name,
					operation : 'добавил пользователя',
					changed: {
						name: user.name,
						email: user.email
					},
					date: Date()
				}).save()
				response.json(user)
			}
		}
	})
})

app.post('/deleteUser', jsonParser, async (request, response) => {
	const id = request.body.id
	const jwtToken = request.body.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			let user = await NewUserItem.findOneAndDelete({
				_id: id
			})
			await LogItem({
				owner: admin.name,
				operation : 'удалил пользователя',
				changed: {
					name: user.name,
					email: user.email
				},
				date: Date()
			}).save()
			response.json({operation: 'delete'})
		}
	})
})

app.post('/editUser', jsonParser, async (request, response) => {
	const id = request.body.id
	const jwtToken = request.body.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			let user = await NewUserItem.findOneAndUpdate({_id: id}, {
				$set : request.body.edit
			})
			let editValues = Object.keys(request.body.edit)
			await LogItem({
				owner: admin.name,
				operation : 'изменил пользователя',
				changed: {
					name: user.name,
					email: user.email
				},
				changeData : Object.assign(...editValues.map(item => {
					return {
						[item] : [user[item], request.body.edit[item]]
					}
				})),
				date: Date() 
			}).save()
			.then(() => {
				response.json({message: `Пользователь ${id} обновлён`, user: user})
			})
		}
	})
})

app.get('/getUsers', async (request, response) => {
	const jwtToken = request.query.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			await NewUserItem.find({})
			.then(users => {
				response.json(users)
			})
		}
	})
})

app.get('/getJobs', async (request,response) => {
	const jwtToken = request.query.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			await JobItem.find({})
			.then(jobs => {
				response.json(jobs)
			})
		}
	})
})

app.post('/auth', jsonParser, async (request, response) => {
	const email = request.body.email
	const password = request.body.password
	await NewUserItem.findOne({email, password})
	.then(async user => {
		if(user){
			response.json({name : user.name, email: user.email, id: user._id, token: user.jwt})
		} else {
			response.json({message: 'Пользователь не найден!'})
		}
	})
})

app.post('/createWorker', jsonParser, async (request, response) => {
	const name = request.body.name
	const rate = request.body.rate
	const phone = request.body.phone
	const jwtToken = request.body.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			let potentialWorker = await WorkerItem.findOne({
				phone
			})
			if(potentialWorker){
				response.json({message: 'Сотрудник уже существует'})
			} else {
				let worker = await new WorkerItem({
					name,
					rate,
					phone,
				}).save()
				await LogItem({
					owner: admin.name,
					operation : 'добавил сотрудника',
					changed: {
						name: worker.name,
						phone: worker.phone
					},
					date: Date()
				}).save()
				response.json(worker)
			}
		}
	})
})

app.post('/deleteWorker', jsonParser, async (request, response) => {
	const id = request.body.id
	const jwtToken = request.body.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			let worker = await WorkerItem.findOneAndDelete({
				_id: id
			})
			await LogItem({
				owner: admin.name,
				operation : 'удалил сотрудника',
				changed: {
					name: worker.name,
					phone: worker.phone
				},
				date:Date()
			}).save()
			response.json({operation: 'delete'})
		}
	})
})

app.post('/editWorker', jsonParser, async (request, response) => {
	const id = request.body.id
	const jwtToken = request.body.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			if(request.body.edit.phone){
				let potentialWorker = await WorkerItem.findOne({
					phone: request.body.edit.phone
				})
				if(potentialWorker){
					response.json({message: 'Сотрудник с таким номером уже существует'})
				}
			}
			let worker = await WorkerItem.findOneAndUpdate({_id: id}, {
				$set : request.body.edit
			})
			let editValues = Object.keys(request.body.edit)
			await LogItem({
				owner: admin.name,
				operation : 'изменил сотрудника',
				changed: {
					name: worker.name,
					phone: worker.phone
				},
				changeData :  Object.assign(...editValues.map(item => {
					return {
						[item] : [worker[item], request.body.edit[item]]
					}
				})),
				date: Date()
			}).save()
			.then(() => {
				response.json({message: `Сотрудник ${id} обновлён`, worker: worker})
			})
		}
	})
})

app.get('/getWorkers', async (request, response) => {
	const jwtToken = request.query.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			await WorkerItem.find({})
			.then(workers => {
				response.json(workers)
			})
		}
	})
})

app.get('/getLogs', async (request, response) => {
	const jwtToken = request.query.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			await LogItem.find({}).then( data => response.json(data))
		}
	})
})


app.post('/editBonus', jsonParser, async (request, response) => {
	const jwtToken = request.body.jwt;
	const bonusNumber = request.body.bonus
	const id = request.body.id
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			await Bonus.findOneAndUpdate({
				_id: id
			},{
				$set: {
					bonus: bonusNumber
				}
			}).then(async bonus => {
				await new LogItem({
					owner: admin.name,
					operation : `изменил бонус`,
					changed: bonus,
					date: Date()
				}).save()
				response.json({message: 'Bonus update'})
			})
		}
	})
})

app.get('/getReports', async (request, response) => {
	const jwtToken = request.query.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			await Report.find({}).then(reports => {
				Promise.all(reports.map(async report => {
					let worker =  await WorkerItem.findOne({phone: report.telephoneNumber})
					let bonus = await Bonus.findOne({reportID: report._doc._id})
					let editReport = await ReportEditItem.findOne({reportID: report._doc._id })
					let editData = Object.keys(report._doc).map(key => {
						if(key == '_id' || key == '__v'){
							return 0
						}
						if(editReport){
							if(editReport[key]){
								return {
									[key]: editReport[key]
								}
							} else {
								return {
									[key]: false
								}
							}
						} else {
							return {
								[key]: false
							}
						}
					})
					editData.pop()
					editData.shift()
					editData.unshift(bonus ? {bonus: bonus.edit} : {bonus: null})
					editData = Object.assign(...editData)
					return {
						...report._doc,
						...{
							price: worker ? worker.rate * report._doc.spentTimeLog.hours : null,
							rate: worker ? worker.rate : null,
							bonus: bonus ? bonus.bonus : null
						},
						editData: editData
					}
				}))
				.then(reports => {
					response.json(reports)
				})
			})
		}
	})
})

app.post('/editReport', jsonParser, async (request, response) => {
	const id = request.body.id
	const jwtToken = request.body.jwt;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			let report = await Report.findOneAndUpdate({_id: id}, {
				$set : request.body.edit
			})
			let bonus = await Bonus.findOne({reportID : id})
			.then(async bonus => {
				if(bonus && request.body.edit.bonus){
					await Bonus.updateOne({reportID : id}, {
						$set: {
							bonus: request.body.edit.bonus,
							edit: true
						}
					})
				}
			})
			let reportEditItems = Object.assign(...Object.keys(request.body.edit).map(item => {
				return { [item] : true }
			}))
			let reportEdit = await ReportEditItem.findOneAndUpdate({reportID: id}, {
				$set: reportEditItems
			})
			if(!reportEdit){
				await new ReportEditItem(Object.assign(reportEditItems, {reportID: id})).save()
			}
			if(!bonus){
				await new Bonus({
					bonus: request.body.edit.bonus,
					reportID: id,
					edit: true
				}).save()
			}
			let editValues = Object.keys(request.body.edit)
			await LogItem({
				owner: admin.name,
				operation : 'изменил отчет',
				changed: report,
				changeData : Object.assign(...editValues.map(item => {
					return {
						[item] : [report[item], request.body.edit[item]]
					}
				})),
				date: Date()
			}).save()
			.then(() => {
				response.json({message: `Отчет ${id} обновлён`})
			})
		}
	})
})

app.post('/deleteReport', jsonParser, async (request, response) => {
	const jwtToken = request.body.jwt
	const id = request.body.id;
	await NewUserItem.findOne({jwt : jwtToken})
	.then(async admin => {
		if(admin){
			let report = await Report.findOneAndDelete({_id: id})
			if(report){
				await LogItem({
					owner: admin.name,
					operation : 'удалил отчет',
					changed: report,
					date: Date()
				}).save()
				response.json({message: 'Отчет удален'})
			} else {
				response.json({message: 'Отчет не найден'})
			}
		}
	})
})

app.post('/reset', jsonParser, async (request, response) => {
	let email = request.body.email
	let newPass = generatePassword(8, false)
	let user = await NewUserItem.findOneAndUpdate({email}, {
		$set: {
			password: newPass
		}
	})
	if(user){
		await resetPassword(email, newPass)
		response.json({message: 'Сообщение с новым паролем отправленно на почту!'})
	} else {
		response.json({message: 'Пользователь с такой почтой не найден!'})
	}
})


async function resetPassword(email, password){
	let transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 587,
		secure: false,
		auth: {
			user: 'botreports.test@gmail.com',
			pass: 'BotAdmin2020'
		}
    });
    
    await transporter.sendMail({
		from: '"BotReport" <botreports.test@gmail.com>',
		to: email,
		subject: "Сброс пароля",
		html: `Ваш новый пароль: ${password}`
    });
}

