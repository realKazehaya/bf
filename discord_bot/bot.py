import discord
from discord.ext import commands
import requests
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
API_URL = os.environ.get('BASE_URL') + '/assign_badge'

intents = discord.Intents.default()
bot = commands.Bot(command_prefix='!', intents=intents)

@bot.command()
async def bd(ctx, discord_id: str, badge: str):
    if not ctx.author.guild_permissions.manage_roles:
        await ctx.send("No tienes permiso para ejecutar este comando.")
        return

    data = {
        'discord_id': discord_id,
        'badge': badge
    }

    response = requests.post(API_URL, json=data)
    if response.status_code == 200:
        await ctx.send(f"Insignia '{badge}' asignada al usuario con ID {discord_id}.")
    else:
        await ctx.send(f"Error asignando la insignia: {response.json().get('error')}")

bot.run(TOKEN)
