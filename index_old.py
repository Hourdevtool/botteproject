import flet as ft
import requests
import time
import threading

def main(page: ft.Page):
    # ตั้งค่าหน้าต่างโปรแกรมหลัก
    page.title = "Transform Waste into Renewable Trust"
    page.window.width = 1920    
    page.window.height = 1080
    page.padding = 0
    page.bgcolor = "white"
    page.theme_mode = "light"
    page.window.resizable = False

    # ฟังก์ชันสร้างพื้นหลังสีเขียวเอียง
    def get_bg_green():
        return ft.Container(
            bgcolor="#61B964",
            width=3600,
            height=1800,
            rotate=-0.05,
            left=-240,
            top=405,
        )
        
    # ฟังก์ชันสร้างปุ่มย้อนกลับ (ใช้รูปภาพ)
    def get_back_btn(on_click_action):
        return ft.Container(
            content=ft.Image(src="back.png", width=80, height=80),
            bottom=45, left=96,
            on_click=on_click_action
        )

    # -------------------------------------------------------------------
    # หน้าแรก (Home) - สำหรับกรอกหมายเลขสมาชิก
    # -------------------------------------------------------------------
    def show_home(e=None):
        page.controls.clear()
        
        # พื้นหลัง
        bg_green = get_bg_green()

        # ข้อความหัวข้อ
        title_text = ft.Container(
            content=ft.Text(
                "โปรดกรอก\nหมายเลขสมาชิก", 
                size=68, 
                color="#0E9F14",
                weight="bold",
                text_align="left"
            ),
            left=96, top=90
        )

        # ตัวแปรเก็บหมายเลขสมาชิกที่กรอก
        member_number = ft.Text(value="", size=54, color="black", weight="bold", text_align="center")

        # ฟังก์ชันเมื่อกดตัวเลข
        def num_click(e):
            if len(member_number.value) < 10:
                member_number.value += e.control.data
                member_number.update()
                
        # ฟังก์ชันเมื่อกดลบ
        def backspace_click(e):
            if len(member_number.value) > 0:
                member_number.value = member_number.value[:-1]
                member_number.update()
                
        # ฟังก์ชันเมื่อกดยืนยันหมายเลข
        def submit_click(e):
            if member_number.value:
                payload = {
                    "phonenumber": member_number.value
                }
                
                try:
                    response = requests.post("http://127.0.0.1/bottle_api/api/user/machines/1/login", json=payload)
                    
                    if response.status_code == 200:
                        res_data = response.json()
                        token = res_data['token']
                        user_data = res_data['data']
                        page.user_token = token
                        page.member_data = user_data
                        show_action_menu(e)
                    else:
                        snack = ft.SnackBar(ft.Text("ไม่พบหมายเลขนี้ในระบบ โปรดสมัครสมาชิก", size=30), bgcolor="red", open=True)
                        page.overlay.append(snack)
                        member_number.value = ""
                        member_number.update()
                        page.update()
                        
                except Exception as ex:
                    print(f"API Error: {ex}")
                    snack = ft.SnackBar(ft.Text("ไม่สามารถเชื่อมต่อฐานข้อมูลได้", size=30), bgcolor="red", open=True)
                    page.overlay.append(snack)
                    member_number.value = ""
                    member_number.update()
                    page.update()

        # ฟังก์ชันสร้างปุ่มตัวเลขบนแป้นพิมพ์
        def create_btn(text, on_click, bg_color="#E0E0E0", text_color="black"):
            return ft.Container(
                content=ft.Text(text, size=60, color=text_color, weight="bold"),
                bgcolor=bg_color,
                width=140, height=140,
                border_radius=70,
                alignment=ft.Alignment(0, 0),
                on_click=on_click,
                data=text
            )

        # UI แป้นพิมพ์ตัวเลข (Keypad)
        keypad = ft.Container(
            content=ft.Column([
                # ช่องแสดงตัวเลขที่กรอก
                ft.Container(
                    content=member_number,
                    width=600, height=120,
                    bgcolor="white",
                    border=ft.Border(
                        top=ft.BorderSide(4, "#A0A0A0"),
                        bottom=ft.BorderSide(4, "#A0A0A0"),
                        left=ft.BorderSide(4, "#A0A0A0"),
                        right=ft.BorderSide(4, "#A0A0A0")
                    ),
                    border_radius=20,
                    alignment=ft.Alignment(0, 0)
                ),
                ft.Row([create_btn("1", num_click), create_btn("2", num_click), create_btn("3", num_click)], alignment="center", spacing=35),
                ft.Row([create_btn("4", num_click), create_btn("5", num_click), create_btn("6", num_click)], alignment="center", spacing=35),
                ft.Row([create_btn("7", num_click), create_btn("8", num_click), create_btn("9", num_click)], alignment="center", spacing=35),
                ft.Row([
                    ft.Container(bgcolor="#FF4D4D", width=140, height=140, border_radius=70, on_click=backspace_click), 
                    create_btn("0", num_click), 
                    ft.Container(bgcolor="#5CB85C", width=140, height=140, border_radius=70, on_click=submit_click), 
                ], alignment="center", spacing=35),
            ], spacing=25, alignment="center"),
            bgcolor="white",
            padding=ft.Padding(left=40, right=40, top=40, bottom=40),
            border_radius=40,
            border=ft.Border(
                top=ft.BorderSide(20, "#E8F5E9"),
                bottom=ft.BorderSide(20, "#E8F5E9"),
                left=ft.BorderSide(20, "#E8F5E9"),
                right=ft.BorderSide(20, "#E8F5E9")
            ),
            top=60, left=750, width=720
        )

        # ปุ่มสมัครสมาชิก
        register_btn = ft.Container(
            content=ft.Text("สมัครสมาชิก", size=54, color="white", weight="bold"),
            bgcolor="#5CB85C",
            border=ft.Border(
                top=ft.BorderSide(6, "white"),
                bottom=ft.BorderSide(6, "white"),
                left=ft.BorderSide(6, "white"),
                right=ft.BorderSide(6, "white")
            ),
            border_radius=25,
            padding=ft.Padding(left=50, right=50, top=20, bottom=20),
            top=400, left=50,
            on_click=lambda e: show_register(e)
        )

        # ปุ่มมุมซ้ายล่างสำหรับเจ้าหน้าที่
        staff_only = ft.Container(
            content=ft.Row(
                [
                    ft.Image(src="settings.png", width=80, height=80), 
                    ft.Text("*Staff Only*", size=40, color="red", weight="bold"),
                ],
                spacing=12,
            ),
            left=48, bottom=50,
            on_click=lambda e: show_staff_login(e)
        )

        # รวม UI ทั้งหมดของหน้าแรก
        home_stack = ft.Stack([bg_green, title_text, keypad, register_btn, staff_only], width=1920, height=1080)
        
        page.add(home_stack)
        page.update()

    # -------------------------------------------------------------------
    # หน้าเมนูหลัก (Action Menu) - แสดงหลังจากกรอกหมายเลขสมาชิกสำเร็จ
    # -------------------------------------------------------------------
    def show_action_menu(e=None):
        page.controls.clear()
        
        # ตั้งค่าสถานะการโหลดข้อมูล loop
        page.is_polling = True
        
        # ตรวจสอบข้อมูลสมาชิกใน page
        if hasattr(page, 'member_data'):
            fname = page.member_data['fname']
            lname = page.member_data['lname']
            point = page.member_data['point']
            display_user = f"คุณ {fname} {lname} (แต้ม: {point})"
        else:
            display_user = "สมาชิกทั่วไป"
            
        # พื้นหลังสีเขียวเต็มจอ
        bg_full_green = ft.Container(
            bgcolor="#61B964",
            width=1920,
            height=1080,
            left=0, top=0
        )

        # แถบสีขาวเอียงด้านล่าง
        bg_white_stripe = ft.Container(
            bgcolor="white",
            width=3600,
            height=1800,
            rotate=-0.05,
            left=-240,
            top=405,
        )

        # ข้อความหัวข้อหลัก
        title = ft.Container(
            content=ft.Column(
                [
                    ft.Text("Transform Waste into", size=80, color="white", weight="w600"),
                    ft.Text("Renewable Trust", size=80, color="#E8F5E9", weight="w600"),
                ],
                spacing=0,
            ),
            left=96,
            top=90,
        )

        # กล่องสำหรับแสดงจำนวนขวด
        bottle_count_text = ft.Text("กำลังโหลดจำนวนขวด...", size=40, color="white", weight="bold")
        bottle_count_box = ft.Container(
            content=bottle_count_text,
            bgcolor="#FF9800",
            border_radius=20,
            padding=ft.Padding(left=40, right=40, top=20, bottom=20),
            alignment=ft.Alignment(0, 0),
            top=90, left=1000
        )

        # ฟังก์ชันสร้างปุ่มเมนูขนาดใหญ่
        def modern_button(text, top_pos, on_click, bg_color="#5CB85C"):
            return ft.Container(
                content=ft.Text(text, size=60, color="white", weight="w500"),
                bgcolor=bg_color,
                border=ft.Border(
                    top=ft.BorderSide(6, "white"),
                    bottom=ft.BorderSide(6, "white"),
                    left=ft.BorderSide(6, "white"),
                    right=ft.BorderSide(6, "white")
                ),
                border_radius=30,
                padding=ft.Padding(left=70, right=70, top=35, bottom=35),
                alignment=ft.Alignment(0, 0),
                width=840,
                on_click=on_click
            )

        def on_ui_update(topic):
            page.update()
            
        page.pubsub.subscribe(on_ui_update)
        
        # คอนเทนเนอร์สำหรับใส่ปุ่มแลกรางวัล (แต้ม หรือ เงิน)
        reward_btn_container = ft.Container(top=300, right=96)
        
        # ฟังก์ชันเมื่อกดปุ่ม (ตอนนี้ให้ print ดูก่อน สามารถเปลี่ยนเป็นเรียก API redeem ได้)
        def handle_redeem(e):
            print(f"Clicked: {e.control.content.value}")
            
        def poll_machine_status():
            m_id = 1 # เปลี่ยนตามรหัสตู้ที่ติดตั้งจริง
            while getattr(page, 'is_polling', False):
                try:
                    # ใส่เวลา t ป้องกันการดึงข้อมูลจากแคชเดิม (Cache-busting)
                    response = requests.get(f"http://127.0.0.1/bottle_api/api/user/machines/{m_id}/status?t={time.time()}")
                    if response.status_code == 200:
                        res_data = response.json()
                        if res_data.get('status') == 'success':
                            m_data = res_data['data']
                            count = m_data['count']
                            m_type = m_data['type']
                            allow = m_data['allow']
                            
                            # อัปเดตจำนวนขวด
                            bottle_count_text.value = f"จำนวนขวดที่รับแล้ว: {count} / 10"
                            
                            # อัปเดตปุ่มตามการตั้งค่า type (ถ้า allow = false สามารถสร้างปุ่มปิดบริการได้)
                            if allow:
                                if m_type == 'point':
                                    reward_btn_container.content = modern_button("สะสมแต้มสมาชิก", 0, handle_redeem)
                                else:
                                    reward_btn_container.content = modern_button("รับคูปองเงินสด", 0, handle_redeem, bg_color="#2196F3")
                            else:
                                reward_btn_container.content = modern_button("ตู้ปิดให้บริการ", 0, lambda _: None, bg_color="#F44336")
                                
                            page.pubsub.send_all("update")
                except Exception as ex:
                    print(f"Polling Error: {ex}")
                time.sleep(0.5)

        # กล่องชื่อสมาชิกมุมขวาบน
        user_profile_box = ft.Container(
            content=ft.Text(display_user, size=36, color="white", weight="bold"),
            bgcolor="#727272",
            border=ft.Border(
                top=ft.BorderSide(4, "white"),
                bottom=ft.BorderSide(4, "white"),
                left=ft.BorderSide(4, "white"),
                right=ft.BorderSide(4, "white")
            ),
            border_radius=30,
            padding=ft.Padding(left=40, right=40, top=20, bottom=20),
            top=200, right=96
        )

        def on_back(e):
            page.is_polling = False
            show_home(e)

        # ปุ่มย้อนกลับ
        back_btn = get_back_btn(on_back)

        # รวม UI ทั้งหมดของหน้าเมนูหลัก
        action_stack = ft.Stack([bg_full_green, bg_white_stripe, title, bottle_count_box, reward_btn_container, user_profile_box, back_btn], width=1920, height=1080)
        page.add(action_stack)
        page.update()
        
        # เริ่มการวนลูปดึงข้อมูล
        threading.Thread(target=poll_machine_status, daemon=True).start()

    # -------------------------------------------------------------------
    # หน้าเข้าสู่ระบบเจ้าหน้าที่ (Staff Login)
    # -------------------------------------------------------------------
    def show_staff_login(e=None):
        page.controls.clear()
        
        # ฟังก์ชันช่วยสร้างเส้นขอบ
        def b_all(width, color):
            return ft.Border(
                top=ft.BorderSide(width, color),
                bottom=ft.BorderSide(width, color),
                left=ft.BorderSide(width, color),
                right=ft.BorderSide(width, color)
            )
        
        # ตัวแปรเก็บข้อมูลที่กรอก (เบอร์โทร + PIN รวมกัน)
        # รูปแบบ: กรอกเบอร์ก่อน แล้วกด ✓ จะสลับไปกรอก PIN
        input_mode = ["phone"]  # "phone" หรือ "pin"
        staff_phone_val = [""]
        staff_pin_val = [""]
        
        display_text = ft.Text(value="", size=50, color="black", weight="bold")
        
        # แถบสีเขียวด้านบน
        top_banner = ft.Container(bgcolor="#5CB85C", width=1920, height=200, top=0, left=0)
        
        # ป้ายข้อความ LOGIN
        login_label = ft.Container(
            content=ft.Text("LOGIN", size=54, color="white", weight="bold"),
            border=b_all(6, "white"),
            border_radius=15,
            padding=ft.Padding(left=30, right=30, top=10, bottom=10),
            left=50, top=50
        )
        
        # ช่องกรอกข้อมูลสีขาวยาว (อยู่ข้างป้าย LOGIN)
        input_box = ft.Container(
            content=display_text,
            bgcolor="white",
            width=1050, height=100,
            border=b_all(4, "#A0A0A0"),
            border_radius=15,
            padding=ft.Padding(left=20, right=20, top=0, bottom=0),
            alignment=ft.Alignment(-1, 0),
            left=800, top=50
        )
        
        # ฟังก์ชันเมื่อกดตัวเลข
        def num_click(e):
            val = e.control.data
            if input_mode[0] == "phone" and len(staff_phone_val[0]) < 10:
                staff_phone_val[0] += val
                display_text.value = staff_phone_val[0]
            elif input_mode[0] == "pin" and len(staff_pin_val[0]) < 10:
                staff_pin_val[0] += val
                display_text.value = "*" * len(staff_pin_val[0])
            page.update()
                
        # ฟังก์ชันเมื่อกดลบ
        def backspace_click(e):
            if input_mode[0] == "phone" and len(staff_phone_val[0]) > 0:
                staff_phone_val[0] = staff_phone_val[0][:-1]
                display_text.value = staff_phone_val[0]
            elif input_mode[0] == "pin" and len(staff_pin_val[0]) > 0:
                staff_pin_val[0] = staff_pin_val[0][:-1]
                display_text.value = "*" * len(staff_pin_val[0])
            page.update()
                
        # ฟังก์ชันเมื่อกดยืนยัน
        def submit_click(e):
            if input_mode[0] == "phone":
                if staff_phone_val[0]:
                    # สลับไปกรอก PIN
                    input_mode[0] = "pin"
                    display_text.value = ""
                    login_label.content = ft.Text("PIN", size=54, color="white", weight="bold")
                    page.update()
            elif input_mode[0] == "pin":
                if staff_pin_val[0]:
                    # ส่งข้อมูลล็อกอิน
                    payload = {
                        "identifier": staff_phone_val[0],
                        #"email": staff_phone_val[0], # ส่ง email ไปด้วย เผื่อ backend เก่าบังคับให้ต้องมี email
                        "password": staff_pin_val[0]
                    }
                    try:
                        response = requests.post("http://127.0.0.1/bottle_api/api/login", json=payload)
                        if response.status_code == 200:
                            res_data = response.json()
                            if res_data.get('status') == 'success':
                                page.staff_token = res_data['token']
                                show_staff_dashboard(e)
                            else:
                                error_msg = res_data.get('message', 'เบอร์หรือรหัสผ่านไม่ถูกต้อง')
                                snack = ft.SnackBar(ft.Text(error_msg, size=30), bgcolor="red", open=True)
                                page.overlay.append(snack)
                                # รีเซ็ตกลับไปกรอกเบอร์ใหม่
                                input_mode[0] = "phone"
                                staff_phone_val[0] = ""
                                staff_pin_val[0] = ""
                                display_text.value = ""
                                login_label.content = ft.Text("LOGIN", size=54, color="white", weight="bold")
                                display_text.update()
                                login_label.update()
                                page.update()
                        else:
                            try:
                                res_data = response.json()
                                error_msg = res_data.get('message', 'เบอร์หรือรหัสผ่านไม่ถูกต้อง')
                            except:
                                error_msg = "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์"
                            snack = ft.SnackBar(ft.Text(error_msg, size=30), bgcolor="red", open=True)
                            page.overlay.append(snack)
                            # รีเซ็ตกลับไปกรอกเบอร์ใหม่
                            input_mode[0] = "phone"
                            staff_phone_val[0] = ""
                            staff_pin_val[0] = ""
                            display_text.value = ""
                            login_label.content = ft.Text("LOGIN", size=54, color="white", weight="bold")
                            display_text.update()
                            login_label.update()
                            page.update()
                    except Exception as ex:
                        print(f"API Error: {ex}")
                        snack = ft.SnackBar(ft.Text("ไม่สามารถเชื่อมต่อฐานข้อมูลได้", size=30), bgcolor="red", open=True)
                        page.overlay.append(snack)
                        # รีเซ็ตกลับไปกรอกเบอร์ใหม่
                        input_mode[0] = "phone"
                        staff_phone_val[0] = ""
                        staff_pin_val[0] = ""
                        display_text.value = ""
                        login_label.content = ft.Text("LOGIN", size=54, color="white", weight="bold")
                        display_text.update()
                        login_label.update()
                        page.update()
            
        # ฟังก์ชันสร้างปุ่มแป้นพิมพ์
        def create_btn(text, on_click, bg_color="#E0E0E0", text_color="black"):
            return ft.Container(
                content=ft.Text(text, size=60, color=text_color, weight="bold"),
                bgcolor=bg_color, width=140, height=140, border_radius=70,
                alignment=ft.Alignment(0, 0), on_click=on_click, data=text
            )

        # UI แป้นพิมพ์ตัวเลข (อยู่ฝั่งขวา เหมือนหน้า Home)
        keypad = ft.Container(
            content=ft.Column([
                ft.Row([create_btn("1", num_click), create_btn("2", num_click), create_btn("3", num_click)], alignment="center", spacing=35),
                ft.Row([create_btn("4", num_click), create_btn("5", num_click), create_btn("6", num_click)], alignment="center", spacing=35),
                ft.Row([create_btn("7", num_click), create_btn("8", num_click), create_btn("9", num_click)], alignment="center", spacing=35),
                ft.Row([
                    ft.Container(bgcolor="#FF4D4D", width=140, height=140, border_radius=70, on_click=backspace_click), 
                    create_btn("0", num_click), 
                    ft.Container(bgcolor="#5CB85C", width=140, height=140, border_radius=70, on_click=submit_click), 
                ], alignment="center", spacing=35),
            ], spacing=25, alignment="center"),
            top=300, right=150
        )

        # ปุ่มย้อนกลับ
        back_btn = get_back_btn(show_home)

        # รวม UI ของหน้าเข้าสู่ระบบเจ้าหน้าที่
        staff_login_stack = ft.Stack([top_banner, login_label, input_box, keypad, back_btn], width=1920, height=1080)
        page.add(staff_login_stack)
        page.update()

    # -------------------------------------------------------------------
    # หน้าสมัครสมาชิก (Register) - แสดง QR Code
    # -------------------------------------------------------------------
    def show_register(e=None):
        page.controls.clear()
        
        # พื้นหลังสีขาว
        bg_white = ft.Container(bgcolor="white", width=1920, height=1080)
        
        # แถบสีเขียวฝั่งซ้าย
        bg_green_left = ft.Container(
            bgcolor="#61B964",
            width=1000,
            height=1800,
            rotate=-0.05,
            left=-400,
            top=-300,
        )
        
        # แถบสีเขียวฝั่งขวา
        bg_green_right = ft.Container(
            bgcolor="#61B964",
            width=1000,
            height=1800,
            rotate=-0.05,
            right=-400,
            top=-300,
        )
        
        # แถบสีขาวซ้ายสุด สำหรับรองรับปุ่มย้อนกลับให้มองเห็นชัดเจน
        bg_white_left_bar = ft.Container(
            bgcolor="white",
            width=280,
            height=1080,
            rotate=-0.05,
            left=-30, top=0
        )
        
        # รูปภาพ QR Code ตรงกลางหน้าจอ
        qr_image = ft.Container(
            content=ft.Image(src="qr-code.jpg", width=600, height=600, fit="contain"),
            alignment=ft.Alignment(0, 0),
            left=660, top=240
        )
        
        # ปุ่มย้อนกลับ
        back_btn = get_back_btn(show_home)
        
        # รวม UI ของหน้าสมัครสมาชิก
        register_stack = ft.Stack([
            bg_white, 
            bg_green_left, 
            bg_green_right, 
            bg_white_left_bar,
            qr_image,
            back_btn
        ], width=1920, height=1080)
        
        page.add(register_stack)
        page.update()

    # -------------------------------------------------------------------
    # หน้าตั้งค่าระบบ (Staff Dashboard) - สำหรับตั้งค่าแต้มและราคา
    # -------------------------------------------------------------------
    def show_staff_dashboard(e=None):
        page.controls.clear()
        
        # พื้นหลังสีขาว
        bg_white = ft.Container(bgcolor="white", width=1920, height=1080)
        
        # แถบสีเขียวแนวตั้งตรงกลาง
        vertical_bar = ft.Container(bgcolor="#61B964", width=60, height=1080, left=420, top=0)
        
        # ฟังก์ชันสร้างปุ่มชนิดขวด (ใส, ทึบ, ขุ่น)
        def bottle_btn(text, top_pos):
            return ft.Container(
                content=ft.Text(text, size=60, color="white", weight="bold"),
                bgcolor="#5CB85C",
                border=ft.Border(
                    top=ft.BorderSide(6, "white"),
                    bottom=ft.BorderSide(6, "white"),
                    left=ft.BorderSide(6, "white"),
                    right=ft.BorderSide(6, "white")
                ),
                width=400, height=140,
                border_radius=20,
                alignment=ft.Alignment(0, 0),
                left=250, top=top_pos
            )
            
        # สร้างปุ่มประเภทขวด
        btn_clear = bottle_btn("ขวดใส", 200)
        btn_opaque = bottle_btn("ขวดทึบ", 450)
        btn_trans = bottle_btn("ขวดขุ่น", 700)
        
        # หัวตาราง (แต้ม/กรัม และ บาท/กรัม)
        header_points = ft.Text("แต้ม/กรัม", size=60, color="#0E9F14", weight="bold")
        header_baht = ft.Text("บาท/กรัม", size=60, color="#0E9F14", weight="bold")
        
        # แถวหัวตาราง
        headers = ft.Container(
            content=ft.Row([
                ft.Container(content=header_points, width=400, alignment=ft.Alignment(0,0)),
                ft.Container(content=header_baht, width=400, alignment=ft.Alignment(0,0))
            ], spacing=100),
            left=800, top=80
        )
        
        # ฟังก์ชันสร้างช่องใส่ตัวเลข (ราคา/แต้ม)
        def value_box(val_text, top_pos, left_pos):
            return ft.Container(
                content=ft.Text(val_text, size=70, color="#0E9F14", weight="bold"),
                bgcolor="white",
                border=ft.Border(
                    top=ft.BorderSide(6, "#5CB85C"),
                    bottom=ft.BorderSide(6, "#5CB85C"),
                    left=ft.BorderSide(6, "#5CB85C"),
                    right=ft.BorderSide(6, "#5CB85C")
                ),
                border_radius=20,
                width=400, height=140,
                alignment=ft.Alignment(0, 0),
                left=left_pos, top=top_pos
            )
            
        # สร้างช่องข้อมูลแถวที่ 1 (ขวดใส)
        val_clear_pt = value_box("10", 200, 800)
        val_clear_baht = value_box("0.008", 200, 1300)
        
        # สร้างช่องข้อมูลแถวที่ 2 (ขวดทึบ)
        val_opaque_pt = value_box("12", 450, 800)
        val_opaque_baht = value_box("0.01", 450, 1300)
        
        # สร้างช่องข้อมูลแถวที่ 3 (ขวดขุ่น)
        val_trans_pt = value_box("4", 700, 800)
        val_trans_baht = value_box("0.0003", 700, 1300)
        
        # ปุ่มย้อนกลับ
        back_btn = get_back_btn(show_staff_login)
        
        # รวม UI ของหน้าตั้งค่าระบบ
        dashboard_stack = ft.Stack([
            bg_white, 
            vertical_bar, 
            btn_clear, btn_opaque, btn_trans,
            headers,
            val_clear_pt, val_clear_baht,
            val_opaque_pt, val_opaque_baht,
            val_trans_pt, val_trans_baht,
            back_btn
        ], width=1920, height=1080)
        
        page.add(dashboard_stack)
        page.update()

    # เริ่มหน้าแรก
    show_home()

# รันแอปพลิเคชัน
if __name__ == "__main__":
    if hasattr(ft, "run"):
        ft.run(main, assets_dir="assets")
    else:
        try:
            ft.app(target=main, assets_dir="assets")
        except AttributeError:
            ft.app(main, assets_dir="assets")
