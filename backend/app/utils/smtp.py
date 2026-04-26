import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from typing import Literal

from ..config import get_settings


log = logging.getLogger(__name__)
settings = get_settings()
smtp = smtplib.SMTP_SSL(settings.smtp.SERVER, settings.smtp.PORT)


def send_email(to_address, subject, body, subtype: Literal["plain", "html"]="plain"):
    
    smtp.connect(settings.smtp.SERVER, settings.smtp.PORT)
    
    msg = MIMEMultipart()
    msg["From"] = Header(settings.smtp.DEFAULT_SENDER, "utf-8")
    msg["To"] = Header(to_address, "utf-8")
    msg["Subject"] = Header(subject, "utf-8")
    msg.attach(MIMEText(body, subtype, "utf-8"))
    
    try:  
        smtp.login(settings.smtp.USERNAME, settings.smtp.PASSWORD)
        smtp.sendmail(settings.smtp.USERNAME, to_address, msg.as_string())
        
    except smtplib.SMTPException as e:
        log.error(f"Failed to send email to {to_address}: {e}")
    
    finally:
        smtp.quit()
