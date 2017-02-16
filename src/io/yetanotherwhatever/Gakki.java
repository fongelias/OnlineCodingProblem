package io.yetanotherwhatever;

import java.io.IOException;
import java.lang.reflect.Array;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Created by achang on 1/12/2017.
 */
public class Gakki {

    public static void main(String[] args)
    {

        Gakki g = new Gakki();
        //g.genTestInput();
        g.solve(args);


    }

    void solve(String[] args)
    {
        try (Stream<String> stream = Files.lines(Paths.get(args[0]))) {
            stream.map(s->gakkify(s)).forEach(s -> System.out.println((s)));

        } catch (IOException ioe)
        {

        }
    }

    static final int NUM_SAMPLES = 10000;
    void genTestInput()
    {
        for (int i = 0; i < NUM_SAMPLES; i++)
        {
            System.out.println(genInput());
        }
    }

    static String genInput()
    {
        String gakki = genGakki(1, MAX_LEN);
        String obf = addRandChars(gakki);
        return obf;
    }

    static final int MIN_LEN = 4;   //inclusive
    static final int MAX_LEN = 30;  //exclusive
    protected static String genGakki()
    {
        return genGakki(MIN_LEN, MAX_LEN);
    }

    protected static String genGakki(int min, int max)
    {
        StringBuilder sb = new StringBuilder();

        char a = randChar();
        char b = randChar();
        while (a == b)
        {
            b = randChar();
        }


        //random len
        int len = (int) ((max - min) * Math.random()) + min;

        for (int i = 0; i < len; i++)
        {
            if (i % 2 == 0)
            {
                sb.append(a);
            }
            else
            {
                sb.append(b);
            }
        }

        return sb.toString();
    }

    //human readable ascii chars
    static final char MIN_CHAR = '!';   //bottom of the ascci range for our legal chars
    static final char MAX_CHAR = '~';   //top of the ascci range for our legal chars (exclusive)
    static char randChar()
    {
        return (char) (((int)MAX_CHAR - (int) MIN_CHAR) * Math.random() + MIN_CHAR);
    }


    static private final int MIN_ADD = 1;
    static private final int MAX_ADD = 5;
    //we will add 1-5 new chars
    //incidence of new chars will be length/10 plus or minus 2 * (each new char added)
    //ie., given gakki of "ababab"
    //'a' and 'b' occur 3 times
    //first new char will be added 3+-2 times
    //second new char will be added 3+-4 times
    //third new char will be added 3+-6 times
    //a new gakki will never be possible this way; since the occurrence of chars in a gakki must be within count of one.
    protected static String addRandChars(String gakki)
    {
        int half = gakki.length()/2;

        int countCharsToAdd = ThreadLocalRandom.current().nextInt(MIN_ADD, MAX_ADD);

        StringBuilder sb = new StringBuilder(gakki);

        int location = 0;
        int diffTimes = 0;
        int newCharIncidents = 0;

        HashSet hs = new HashSet();

        for (int i = 0; i < countCharsToAdd; i++)
        {
            char c = randChar();
            //avoid chars already contained in gakki
            while(gakki.indexOf(c) >= 0 ||
                    hs.contains(new Character(c)))
            {
                c = randChar();
            }

            hs.add(new Character(c));

            diffTimes = 2*(i+1);

            if (diffTimes < half &&
                    (ThreadLocalRandom.current().nextInt(0, 2) == 0))//50% chance
            {
                newCharIncidents = half - diffTimes;
            }
            else
            {
                newCharIncidents = half + diffTimes;
            }

            for (int j = 0; j < newCharIncidents; j++)
            {
                //insert new char at rand location
                location = ThreadLocalRandom.current().nextInt(0, sb.length());

                sb.insert(location, c);
            }

        }

        return sb.toString();
    }


    String addRandChars2(String gakki)
    {
        //gen working set
        int countCharsToAdd = gakki.length()/6 + 1;    //the shorter the string, the fewer we will add

        StringBuilder newCharSb = new StringBuilder();
        //newCharSb.append('\0'); //signifies nothing to add
        for (int i = 0; i < countCharsToAdd; i++)
        {
            char c = randChar();
            //avoid chars already contained in gakki
            while(gakki.indexOf(c) > 0)
            {
                c = randChar();
            }
            newCharSb.append(c);
        }

        String newChars = newCharSb.toString();

        //avoid next == penultimate, so that multiple gakki reductions are not possible (only one answer to solve for)
        char last = '\0';
        char pen = '\0';
        char next = '\0';

        StringBuilder out = new StringBuilder();
        for (int i = 0; i < gakki.length(); i++)
        {
            //pull from orig string
            out.append(gakki.charAt(i));

            //rand char to add
            while (next == pen)
            {
                int rand = ThreadLocalRandom.current().nextInt(0, newChars.length());
                next = newChars.charAt(rand);
            }

            //NULL char means add nothing here
            if (next == '\0')
            {
                continue;
            }
            else
            {
                pen = last;
                last = next;
                out.append(next);
            }
        }

        return out.toString();
    }

    private static String gakkify(String in, boolean retry)
    {
        //get unique chars
        Set uniques = getUniqueChars(in);

        //for each pair, see if removing everything else forms a gakki
        ArrayList<String> pairs = getTwoLetterCombos(uniques);


        for (int i = 0; i < pairs.size(); i++)
        {
            Set otherChars = new HashSet();
            otherChars.addAll(uniques);

            otherChars.remove(pairs.get(i).charAt(0));
            otherChars.remove(pairs.get(i).charAt(1));

            String possibleGakki = removeChars(in, otherChars);

            if (isGakki(possibleGakki))
            {
                return possibleGakki;
            }
        }

        //nothing found - for debugging breakpoint
//        if (retry == false)
//            return gakkify(in, true);
//        else
            return "";
    }


    protected static String gakkify(String in)
    {
        return gakkify(in, false);
    }

    static protected String removeChars(String in, Set toRemove)
    {
        String regex = "";

        Iterator iter = toRemove.iterator();
        while(iter.hasNext())
        {
            Object o = iter.next();
            regex += "\\Q" + o + "\\E*";
        }

        String filtered = in.replaceAll(regex, "");

        return filtered;
    }

    static protected boolean isGakki(String possibleGakki)
    {
        //is this a gakki?
        boolean isGakki = true;

        if(possibleGakki.length() < 4)
        {
            return false;
        }

        for (int k = 0; k < possibleGakki.length(); k++)
        {
            if (k%2 == 0 && possibleGakki.charAt(k) != possibleGakki.charAt(0))
            {
                isGakki = false;
                break;
            }
            else if (k%2 == 1 && possibleGakki.charAt(k) != possibleGakki.charAt(1))
            {
                isGakki = false;
                break;
            }
        }

        return isGakki;
    }

    static protected Set getUniqueChars(String in)
    {
        HashSet<Character> hs = new HashSet<>();

        for (int i = 0; i < in.length(); i++)
        {
            char c =in.charAt(i);
            hs.add(new Character(c));
        }

        return hs;
    }

    static protected ArrayList<String> getTwoLetterCombos(Set uniques)
    {
        Object[] arr = uniques.toArray();
        ArrayList<String> out = new ArrayList();
        for (int i = 0; i < uniques.size() -1; i++)
        {
            for (int j = i+1; j < uniques.size(); j++)
            {
                out.add("" + arr[i] + arr[j]);
            }
        }

        return out;
    }

    void genOutput(String inputFilePath)
    {

    }
}
