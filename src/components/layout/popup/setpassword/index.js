import React, { PureComponent, Fragment } from "react";
import "./index.css";
import { Modal } from "antd";
import { changePopupBox } from "../actionCreators";
import connect from "react-redux/es/connect/connect";
import { Input, Button, message, Form, Icon } from "antd";
import { myRequest } from "../../../../function";
class Index extends PureComponent {
	state = {
		disabledBtn: false, //是否使按钮失效
		leftTime: 120, //重置按钮剩余时间
	
	
		finishFirst: false //是否完成了第一步
	};

	render() {
		const { userInfo } = this.props; //用户信息
		const { getFieldDecorator } = this.props.form;
		return (
			<Modal
				width={450}
				style={{ marginTop: 70 }}
				bodyStyle={{ padding: 24 }}
				destroyOnClose={true}
				footer={null}
				onCancel={() =>
					this.props.changePopupBox([{ type: this.props.popupType }])
				}
				visible={true}
			>
				<div className="login_L">
					<span className="login_s">&nbsp;</span>
					<span className="log_zhu">设置密码</span>
				</div>
				<Form
					onSubmit={this.handleSubmit}
					labelCol={{ span: 4 }}
					wrapperCol={{ span: 20 }}
				>
					{this.state.finishFirst ? (
						<Fragment>
							<Form.Item
								hasFeedback
								extra="2-20位，仅支持汉字字母数字和下划线，不能有空格"
								style={{
									color: "#333",
									fontSize: "16px",
									margin: "0px 0px 0px 0px",
									boxSizing: "content-box"
								}}
							>
								{getFieldDecorator("password", {
									rules: [
										{ required: true, message: "请输入新密码" },
										{ min: 8, message: "密码长度至少为8" },
										{ validator: this.validateToNextPassword }
									]
								})(
									<Input.Password
										placeholder="请输入新的密码"
										type="password"
									/>
								)}
							</Form.Item>
							<Form.Item
								hasFeedback
								style={{
									color: "#333",
									fontSize: "16px",
									margin: "11px 0px 15px 0px"
								}}
							>
								{getFieldDecorator("confirm_password", {
									rules: [
										{ required: true, message: "请再次输入密码" },
										{ min: 8, message: "密码长度至少为8" },
										{ validator: this.compareToFirstPassword }
									]
								})(
									<Input.Password
										placeholder="请再次输入密码"
										type="password"
									/>
								)}
							</Form.Item>
						</Fragment>
					) : (
						<Fragment>
							<Form.Item label="当前绑定">
								{getFieldDecorator("mobile", {
									initialValue: userInfo.user.mobile
								})(
									<span style={{ fontSize: "18px", color: "#333" }}>
										{userInfo.user.mobile}
									</span>
								)}
							</Form.Item>
							<Form.Item label="验证码">
								{getFieldDecorator("code", {
									rules: [
										{ required: true, message: "请输入验证码" },
										{ len: 6, message: "验证码长度必须为6" }
									]
								})(
									<Input
										style={{ width: 200 }}
										type="text"
										placeholder="请输入验证码"
										prefix={<Icon type="mobile" style={{ color: "#bfbfbf" }} />}
									/>
								)}
								{this.state.disabledBtn ? (
									<Button
										disabled={true}
										style={{ marginLeft: 8, width: "110px" }}
									>
										{this.state.leftTime}秒后获取
									</Button>
								) : (
									<Button
										onClick={() => this.sendCode()}
										style={{ marginLeft: 20 }}
									>
										获取验证码
									</Button>
								)}
							</Form.Item>
						</Fragment>
					)}
					<Button
						htmlType="submit"
						style={{
							width: "100%",
							marginTop: 30,
							backgroundColor: "#17191f",
							color: "#fff"
						}}
					>
						{this.state.finishFirst ? "提交" : "下一步"}
					</Button>
				</Form>
			</Modal>
		);
	}

	//发送验证码
	sendCode() {
		//验证账号
		this.props.form.validateFields(["mobile"], (err, values) => {
			let that = this;
			// 验证成功发送请求
			if (!err) {
				let form = this.props.form;
				myRequest({
					method: "post",
					path: "/common/message/send",
					data: {
						mobile: values.mobile,
						user_type: 1,
						code_type: 2
					},
					callback: function(response) {
						//处理返回结果
						if (response.data.code !== 0) {
							//错误提示
							form.setFields({
								code: {
									errors: [new Error(response.data.msg)]
								}
							});
						} else {
							//关闭错误的提示
							form.setFields({
								code: {}
							});
							//改变按钮状态
							that.setState({
								disabledBtn: true
							});
							that.changeBtn(); //发送验证码改变按钮
							//测试环境直接弹窗显示验证码
							if (response.data.data) {
								Modal.success({
									title: "验证码",
									content: response.data.data.code
								});
							}
						}
					}
				});
			}
		});
	}

	//改变按钮状态
	changeBtn() {
		let that = this;
		//实时改变按钮状态
		let interval = setInterval(() => {
			let left = that.state.leftTime - 1;
			that.setState({
				leftTime: left
			});
			//如果间隔时间小于0，重置按钮
			if (this.state.leftTime <= 0) {
				//清楚定时器
				clearInterval(interval);
				this.setState({
					disabledBtn: false,
					leftTime: 120
				});
			}
		}, 1000);
	}

	//校验确认密码是否与密码一致
	compareToFirstPassword = (rule, value, callback) => {
		const form = this.props.form;
		if (value && value !== form.getFieldValue("password")) {
			callback("密码输入不一致");
		} else {
			callback();
		}
	};
	//改变密码后再次判断两次输入密码是否一致
	validateToNextPassword = (rule, value, callback) => {
		const form = this.props.form;
		if (
			form.getFieldValue("confirm_password") &&
			value !== form.getFieldValue("confirm_password")
		) {
			form.validateFields(["confirm_password"], { force: true });
		} else {
			//关闭错误提示
			form.setFields({
				confirm_password: {
					value: form.getFieldValue("confirm_password")
				}
			});
		}
		callback();
	};
	handleSubmit = e => {
		e.preventDefault();
		if (this.state.finishFirst) {
			this.props.form.validateFields(
				["password", "confirm_password"],
				(err, values) => {
					if (!err) {
						let that = this;
						//提交请求
						myRequest({
							method: "post",
							path: "/common/auth/set_password",
							data: {
								password: values.password
							},
							auth: true,
							callback: function(response) {
					
								//处理返回结果
								if (response.data.code === 0) {
									//关闭登录框
									message.success("密码设置成功");
									that.props.changePopupBox([{ type: "setpassword" }]);
								} else {
									message.error(response.data.msg);
								}
							}
						});
					}
				}
			);
		} else {
			this.props.form.validateFields(["mobile", "code"], (err, values) => {
				if (!err) {
					//修改按钮状态
					this.setState({ loading: true });
					let that = this;
					that.setState({
						finishFirst: true
					});
				}
			});
		}
	};
}

const mapState = state => {
	return {
		userInfo: state.getIn(["header", "userInfo"]) //用户信息
	};
};
const mapDispath = dispath => {
	return {
		//改变弹出框状态
		changePopupBox(info) {
			dispath(changePopupBox(info));
		}
	};
};

//数据仓库
export default connect(mapState, mapDispath)(Form.create()(Index));
