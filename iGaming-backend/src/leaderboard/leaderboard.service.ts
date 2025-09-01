import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getTopPlayers(limit: number = 10) {
    const players = await this.prisma.user.findMany({
      include: {
        sessions: true, // Get all sessions (wins and losses)
      },
    });

    const playersWithStats = players.map(player => ({
      id: player.id,
      username: player.username,
      wins: player.sessions.filter(session => session.isWinner).length,
      totalGames: player.sessions.length, // Count all games, not just wins
    }));

    return playersWithStats
      .sort((a, b) => b.wins - a.wins)
      .slice(0, limit);
  }

  async getSessionsByDate(startDate?: string, endDate?: string) {
    const whereClause: any = {
      isCompleted: true,
    };

    if (startDate) {
      whereClause.startedAt = {
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      whereClause.startedAt = {
        ...whereClause.startedAt,
        lte: new Date(endDate),
      };
    }

    return this.prisma.gameSession.findMany({
      where: whereClause,
      include: {
        participants: {
          where: {
            isInQueue: false, // Only include active participants, not queued ones
          },
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc', // Order by date
      },
    });
  }

  async getPlayersByPeriod(period: 'day' | 'week' | 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const sessions = await this.prisma.gameSession.findMany({
      where: {
        startedAt: {
          gte: startDate,
        },
        isCompleted: true,
      },
      include: {
        participants: {
          where: {
            isWinner: true,
          },
          include: {
            user: true,
          },
        },
      },
    });

    const winnerCounts = new Map<string, { username: string; wins: number }>();

    sessions.forEach(session => {
      session.participants.forEach(participant => {
        const userId = participant.user.id;
        if (winnerCounts.has(userId)) {
          winnerCounts.get(userId).wins++;
        } else {
          winnerCounts.set(userId, {
            username: participant.user.username,
            wins: 1,
          });
        }
      });
    });

    return Array.from(winnerCounts.values())
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 10);
  }
  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const totalGames = user.sessions.length;
    const wins = user.sessions.filter(session => session.isWinner).length;
    const losses = totalGames - wins;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    return {
      totalWins: wins,
      totalLosses: losses,
      totalGames,
      winRate: `${winRate}%`,
    };
  }
}